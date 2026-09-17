import { db } from "@/lib/db"

export async function logActivity(
  userId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.activity.create({
      data: {
        userId,
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (e) {
    console.error("Failed to log activity:", e)
  }
}
