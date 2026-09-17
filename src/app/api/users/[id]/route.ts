import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { hashPassword } from "@/lib/auth-utils"
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// GET /api/users/[id] - Get a single user with stats (admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  const { id } = await params
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        phone: true,
        avatar: true,
        active: true,
        createdAt: true,
      },
    })
    if (!user) return notFound("User not found")

    // Gather stats
    const [attendanceCount, leaveCount, taskCount, recentActivities, recentAttendances, recentTasks] =
      await Promise.all([
        db.attendance.count({ where: { userId: id, status: "PRESENT" } }),
        db.leave.count({ where: { userId: id, status: "APPROVED" } }),
        db.task.count({ where: { userId: id } }),
        db.activity.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        db.attendance.findMany({
          where: { userId: id },
          orderBy: { date: "desc" },
          take: 14,
        }),
        db.task.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])

    return ok({
      user,
      stats: {
        presentDays: attendanceCount,
        leaveDays: leaveCount,
        totalTasks: taskCount,
      },
      activities: recentActivities,
      attendances: recentAttendances,
      tasks: recentTasks,
    })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// PATCH /api/users/[id] - Update user (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  const { id } = await params
  try {
    const body = await req.json()
    const { name, email, password, role, position, phone, active } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return notFound("User not found")

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = String(name).trim()
    if (email !== undefined) {
      const normalizedEmail = String(email).toLowerCase().trim()
      const conflict = await db.user.findUnique({ where: { email: normalizedEmail } })
      if (conflict && conflict.id !== id) {
        return badRequest("Email already in use")
      }
      data.email = normalizedEmail
    }
    if (password !== undefined && password) {
      if (String(password).length < 6) {
        return badRequest("Password must be at least 6 characters")
      }
      data.password = await hashPassword(String(password))
    }
    if (role !== undefined) data.role = role === "ADMIN" ? "ADMIN" : "EMPLOYEE"
    if (position !== undefined) data.position = position?.trim() || null
    if (phone !== undefined) data.phone = phone?.trim() || null
    if (active !== undefined) data.active = Boolean(active)

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })

    await logActivity(admin.id, "PROFILE_UPDATE", `Updated user: ${updated.name}`, {
      userId: id,
      changes: Object.keys(data),
    })

    return ok(updated)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// DELETE /api/users/[id] - Deactivate user (admin only, soft delete)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  const { id } = await params
  try {
    if (id === admin.id) {
      return badRequest("You cannot delete your own account")
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return notFound("User not found")

    // Soft delete - deactivate
    const updated = await db.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true },
    })

    await logActivity(admin.id, "USER_CREATE", `Deactivated user: ${updated.name}`, {
      userId: id,
      action: "deactivate",
    })

    return ok({ success: true })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
