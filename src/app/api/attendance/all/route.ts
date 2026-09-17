import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { ok, badRequest, forbidden, serverError } from "@/lib/api"

// GET /api/attendance/all - Admin view of all attendance records
// Query params: ?date=YYYY-MM-DD  or  ?userId=xxx  or  ?range=week|month
export async function GET(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    const userId = searchParams.get("userId")
    const range = searchParams.get("range") // "week" | "month"

    const where: {
      userId?: string
      date?: { gte: Date; lte: Date }
    } = {}

    if (userId) {
      where.userId = userId
    }

    if (dateStr) {
      const day = new Date(dateStr)
      day.setHours(0, 0, 0, 0)
      const next = new Date(day)
      next.setDate(next.getDate() + 1)
      where.date = { gte: day, lte: next }
    } else if (range === "week") {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      where.date = { gte: start, lte: now }
    } else if (range === "month") {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      where.date = { gte: start, lte: now }
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, position: true, avatar: true },
        },
      },
      orderBy: { date: "desc" },
      take: 500,
    })

    return ok(records)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
