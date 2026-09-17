import { db } from "@/lib/db"
import { getCurrentUser, requireAdmin } from "@/lib/session"
import { ok, unauthorized, forbidden, serverError } from "@/lib/api"

// GET /api/activities - List activities
// Admin: sees all activities (optional ?userId=)
// Employee: sees only own activities
export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get("userId")
    const type = searchParams.get("type")

    const where: { userId?: string; type?: string } = {}

    if (user.role === "ADMIN") {
      if (userIdParam) where.userId = userIdParam
    } else {
      where.userId = user.id
    }

    if (type) where.type = type

    const activities = await db.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, position: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return ok(activities)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
