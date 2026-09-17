import { db } from "@/lib/db"
import { getCurrentUser, requireAdmin } from "@/lib/session"
import { ok, badRequest, unauthorized, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// GET /api/tasks - List tasks
// Admin: sees all tasks (optional ?userId=)
// Employee: sees only own tasks
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get("userId")
    const status = searchParams.get("status")

    const where: { userId?: string; status?: string } = {}

    if (user.role === "ADMIN") {
      if (userIdParam) where.userId = userIdParam
    } else {
      where.userId = user.id
    }

    if (status) where.status = status

    const tasks = await db.task.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, position: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return ok(tasks)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { title, description, estimatedMinutes, userId } = body

    if (!title || !title.trim()) {
      return badRequest("Title is required")
    }

    // Determine target user: admin can assign to others, employee only to self
    let targetUserId = user.id
    if (user.role === "ADMIN" && userId) {
      targetUserId = userId
    }

    const task = await db.task.create({
      data: {
        userId: targetUserId,
        title: title.trim(),
        description: description?.trim() || null,
        estimatedMinutes: Math.max(0, Number(estimatedMinutes) || 0),
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await logActivity(user.id, "TASK_CREATE", `Created task: ${task.title}`, {
      taskId: task.id,
      targetUserId: targetUserId,
    })

    return ok(task, 201)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
