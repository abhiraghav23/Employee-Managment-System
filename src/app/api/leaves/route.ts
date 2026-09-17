import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ok, badRequest, unauthorized, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// GET /api/leaves - List leaves
// Admin: sees all leaves
// Employee: sees only own leaves
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: { userId?: string; status?: string } = {}
    if (user.role !== "ADMIN") {
      where.userId = user.id
    }
    if (status) where.status = status

    const leaves = await db.leave.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, position: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return ok(leaves)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// POST /api/leaves - Create a leave request
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const body = await req.json()
    const { startDate, endDate, reason } = body

    if (!startDate || !endDate || !reason) {
      return badRequest("Start date, end date, and reason are required")
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    if (end < start) {
      return badRequest("End date must be after start date")
    }

    const leave = await db.leave.create({
      data: {
        userId: user.id,
        startDate: start,
        endDate: end,
        reason: String(reason).trim(),
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    await logActivity(user.id, "LEAVE_REQUEST", `${user.name} requested leave`, {
      leaveId: leave.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    })

    return ok(leave, 201)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
