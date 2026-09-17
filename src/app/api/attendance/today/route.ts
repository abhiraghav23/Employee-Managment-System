import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ok, badRequest, unauthorized, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// GET /api/attendance/today - Get today's attendance for the current user
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const today = startOfDay(new Date())
    const attendance = await db.attendance.findFirst({
      where: {
        userId: user.id,
        date: today,
      },
    })

    // If there is a live attendance, compute the live worked time
    let liveWorkedSeconds = 0
    let livePausedSeconds = 0
    let isCurrentlyPaused = false
    let isClockedIn = false

    if (attendance && attendance.clockIn && !attendance.clockOut) {
      isClockedIn = true
      isCurrentlyPaused = attendance.isPaused
      const now = Date.now()

      if (attendance.isPaused && attendance.pauseStartedAt && attendance.lastActiveAt) {
        // Currently paused - worked time up to pause, paused includes current pause
        const workedBefore = Math.floor(
          (attendance.pauseStartedAt.getTime() - attendance.lastActiveAt.getTime()) / 1000
        )
        liveWorkedSeconds = attendance.totalWorkedSeconds + Math.max(0, workedBefore)
        const currentPause = Math.floor((now - attendance.pauseStartedAt.getTime()) / 1000)
        livePausedSeconds = attendance.pausedSeconds + Math.max(0, currentPause)
      } else if (attendance.lastActiveAt) {
        // Working
        const currentWork = Math.floor((now - attendance.lastActiveAt.getTime()) / 1000)
        liveWorkedSeconds = attendance.totalWorkedSeconds + Math.max(0, currentWork)
        livePausedSeconds = attendance.pausedSeconds
      }
    } else if (attendance && attendance.clockOut) {
      // Already clocked out
      liveWorkedSeconds = attendance.totalWorkedSeconds
      livePausedSeconds = attendance.pausedSeconds
    }

    return ok({
      attendance,
      isClockedIn,
      isPaused: isCurrentlyPaused,
      liveWorkedSeconds,
      livePausedSeconds,
    })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// POST /api/attendance/today - Clock in
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const today = startOfDay(new Date())
    const now = new Date()

    // Check if already clocked in today
    const existing = await db.attendance.findFirst({
      where: { userId: user.id, date: today },
    })

    if (existing && existing.clockIn && !existing.clockOut) {
      return badRequest("Already clocked in today")
    }

    if (existing && existing.clockOut) {
      return badRequest("Already clocked out today")
    }

    let attendance
    if (existing) {
      // Update existing record (e.g. was on leave but now clocking in)
      attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          clockIn: now,
          lastActiveAt: now,
          status: "PRESENT",
          isPaused: false,
        },
      })
    } else {
      attendance = await db.attendance.create({
        data: {
          userId: user.id,
          date: today,
          clockIn: now,
          lastActiveAt: now,
          status: "PRESENT",
        },
      })
    }

    await logActivity(user.id, "CLOCK_IN", `${user.name} clocked in`, {
      time: now.toISOString(),
    })

    return ok(attendance, 201)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// PATCH /api/attendance/today - Clock out, pause, or resume
export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { action } = body // "clock_out" | "pause" | "resume"

    const today = startOfDay(new Date())
    const attendance = await db.attendance.findFirst({
      where: { userId: user.id, date: today },
    })

    if (!attendance || !attendance.clockIn) {
      return badRequest("Not clocked in today")
    }
    if (attendance.clockOut) {
      return badRequest("Already clocked out today")
    }

    const now = new Date()

    if (action === "pause") {
      if (attendance.isPaused) {
        return badRequest("Already paused")
      }
      // Freeze the worked time: add the current working segment to totalWorkedSeconds
      let additionalWorked = 0
      if (attendance.lastActiveAt) {
        additionalWorked = Math.floor((now.getTime() - attendance.lastActiveAt.getTime()) / 1000)
      }
      await db.attendance.update({
        where: { id: attendance.id },
        data: {
          isPaused: true,
          pauseStartedAt: now,
          totalWorkedSeconds: attendance.totalWorkedSeconds + Math.max(0, additionalWorked),
          lastActiveAt: null,
        },
      })

      await logActivity(user.id, "PAUSE", `${user.name} paused work`, {
        time: now.toISOString(),
      })
      return ok({ success: true, isPaused: true })
    }

    if (action === "resume") {
      if (!attendance.isPaused) {
        return badRequest("Not paused")
      }
      // Add the pause duration to pausedSeconds
      let additionalPaused = 0
      if (attendance.pauseStartedAt) {
        additionalPaused = Math.floor((now.getTime() - attendance.pauseStartedAt.getTime()) / 1000)
      }
      await db.attendance.update({
        where: { id: attendance.id },
        data: {
          isPaused: false,
          pauseStartedAt: null,
          pausedSeconds: attendance.pausedSeconds + Math.max(0, additionalPaused),
          lastActiveAt: now,
        },
      })

      await logActivity(user.id, "RESUME", `${user.name} resumed work`, {
        time: now.toISOString(),
      })
      return ok({ success: true, isPaused: false })
    }

    if (action === "clock_out") {
      // Finalize: add any current working segment, add any current pause
      let finalWorked = attendance.totalWorkedSeconds
      let finalPaused = attendance.pausedSeconds

      if (attendance.isPaused && attendance.pauseStartedAt) {
        const currentPause = Math.floor((now.getTime() - attendance.pauseStartedAt.getTime()) / 1000)
        finalPaused += Math.max(0, currentPause)
      } else if (attendance.lastActiveAt) {
        const currentWork = Math.floor((now.getTime() - attendance.lastActiveAt.getTime()) / 1000)
        finalWorked += Math.max(0, currentWork)
      }

      const updated = await db.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOut: now,
          isPaused: false,
          pauseStartedAt: null,
          lastActiveAt: null,
          totalWorkedSeconds: finalWorked,
          pausedSeconds: finalPaused,
        },
      })

      await logActivity(user.id, "CLOCK_OUT", `${user.name} clocked out`, {
        time: now.toISOString(),
        workedSeconds: finalWorked,
      })

      return ok(updated)
    }

    return badRequest("Invalid action. Use: clock_out, pause, or resume")
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
