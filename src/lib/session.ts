import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  phone: string | null
  avatar: string | null
  active: boolean
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      phone: true,
      avatar: true,
      active: true,
    },
  })

  return user
}

export async function requireAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") return null
  return user
}

export async function requireEmployee(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return user
}
