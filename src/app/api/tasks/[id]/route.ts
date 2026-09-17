import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// PATCH /api/tasks/[id] - Start, end, or update a task
// body: { action: "start" | "end" | "update", title?, description?, estimatedMinutes? }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const { id } = await params
  try {
    const body = await req.json()
    const { action } = body

    const task = await db.task.findUnique({ where: { id } })
    if (!task) return notFound("Task not found")

    // Only the owner or admin can modify
    if (task.userId !== user.id && user.role !== "ADMIN") {
      return forbidden("You can only manage your own tasks")
    }

    const now = new Date()

    if (action === "start") {
      if (task.status === "IN_PROGRESS") {
        return badRequest("Task is already in progress")
      }
      if (task.status === "COMPLETED") {
        return badRequest("Task is already completed")
      }

      // Ensure the user is clocked in (sync with login time)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const attendance = await db.attendance.findFirst({
        where: { userId: task.userId, date: today },
      })

      if (!attendance || !attendance.clockIn || attendance.clockOut) {
        return badRequest("You must clock in before starting a task")
      }

      const updated = await db.task.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: now,
          endedAt: null,
          actualSeconds: 0,
        },
        include: { user: { select: { id: true, name: true } } },
      })

      await logActivity(task.userId, "TASK_START", `Started task: ${task.title}`, {
        taskId: id,
        startTime: now.toISOString(),
      })

      return ok(updated)
    }

    if (action === "end") {
      if (task.status !== "IN_PROGRESS") {
        return badRequest("Task is not in progress")
      }
      if (!task.startedAt) {
        return badRequest("Task has no start time")
      }

      const actualSeconds = Math.floor((now.getTime() - task.startedAt.getTime()) / 1000)

      const updated = await db.task.update({
        where: { id },
        data: {
          status: "COMPLETED",
          endedAt: now,
          actualSeconds: Math.max(0, actualSeconds),
        },
        include: { user: { select: { id: true, name: true } } },
      })

      await logActivity(task.userId, "TASK_END", `Completed task: ${task.title}`, {
        taskId: id,
        actualSeconds,
        endTime: now.toISOString(),
      })

      return ok(updated)
    }

    if (action === "update") {
      const { title, description, estimatedMinutes } = body
      const data: Record<string, unknown> = {}
      if (title !== undefined) data.title = String(title).trim()
      if (description !== undefined) data.description = description?.trim() || null
      if (estimatedMinutes !== undefined)
        data.estimatedMinutes = Math.max(0, Number(estimatedMinutes) || 0)

      const updated = await db.task.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true } } },
      })
      return ok(updated)
    }

    return badRequest("Invalid action. Use: start, end, or update")
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  const { id } = await params
  try {
    const task = await db.task.findUnique({ where: { id } })
    if (!task) return notFound("Task not found")

    if (task.userId !== user.id && user.role !== "ADMIN") {
      return forbidden("You can only delete your own tasks")
    }

    await db.task.delete({ where: { id } })
    return ok({ success: true })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
