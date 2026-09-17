import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/session"
import { hashPassword } from "@/lib/auth-utils"
import { ok, badRequest, forbidden, serverError } from "@/lib/api"
import { logActivity } from "@/lib/activity"

// GET /api/users - List all users (admin only)
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  try {
    const users = await db.user.findMany({
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
      orderBy: { createdAt: "desc" },
    })
    return ok(users)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return forbidden("Admin access required")

  try {
    const body = await req.json()
    const { name, email, password, role, position, phone } = body

    if (!name || !email || !password) {
      return badRequest("Name, email, and password are required")
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return badRequest("Email already in use")
    }

    if (password.length < 6) {
      return badRequest("Password must be at least 6 characters")
    }

    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
        position: position?.trim() || null,
        phone: phone?.trim() || null,
      },
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

    await logActivity(admin.id, "USER_CREATE", `Created user: ${user.name} (${user.email})`, {
      newUserId: user.id,
      role: user.role,
    })

    return ok(user, 201)
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
