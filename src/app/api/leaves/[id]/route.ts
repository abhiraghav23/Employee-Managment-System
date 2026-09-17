import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { ok, badRequest, forbidden, notFound, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// PATCH /api/leaves/[id] - Approve or reject a leave (admin only)
// body: { status: "APPROVED" | "REJECTED" }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  const { id } = await params
  try {
    const body = await req.json()
    const { status } = body

    if (status !== "APPROVED" && status !== "REJECTED") {
      return badRequest("Status must be APPROVED or REJECTED")
    }

    const existing = await db.leave.findUnique({
      where: { id },
      include: { user: true },
    })
    if (!existing) return notFound("Leave request not found")

    const updated = await db.leave.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    // If approved, create leave attendance records for each day in the range
    if (status === "APPROVED") {
      const start = new Date(existing.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(existing.endDate)
      end.setHours(0, 0, 0, 0)

      const days: Date[] = []
      const cursor = new Date(start)
      while (cursor <= end) {
        days.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }

      for (const day of days) {
        // Only create if no record exists for that day
        const existingAtt = await db.attendance.findFirst({
          where: { userId: existing.userId, date: day },
        })
        if (!existingAtt) {
          await db.attendance.create({
            data: {
              userId: existing.userId,
              date: day,
              status: "LEAVE",
              note: existing.reason,
            },
          })
        }
      }
    }

    await logActivity(admin.id, "LEAVE_REQUEST", `${status} leave for ${existing.user.name}`, {
      leaveId: id,
      userId: existing.userId,
      status,
    })

    return ok(updated)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
