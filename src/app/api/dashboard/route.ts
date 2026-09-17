import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/session"
import { ok, unauthorized, serverError } from "@/lib/api"

// GET /api/dashboard - Dashboard stats
// Returns different data for admin vs employee
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  try {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    monthAgo.setHours(0, 0, 0, 0)

    if (user.role === "ADMIN") {
      // Admin dashboard stats
      const [
        totalUsers,
        totalEmployees,
        presentToday,
        onLeaveToday,
        absentToday,
        pendingLeaves,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todayAttendances,
        weekActivities,
      ] = await Promise.all([
        db.user.count({ where: { active: true } }),
        db.user.count({ where: { active: true, role: "EMPLOYEE" } }),
        db.attendance.count({ where: { date: today, status: "PRESENT" } }),
        db.attendance.count({ where: { date: today, status: "LEAVE" } }),
        0, // computed below
        db.leave.count({ where: { status: "PENDING" } }),
        db.task.count(),
        db.task.count({ where: { status: "COMPLETED" } }),
        db.task.count({ where: { status: "IN_PROGRESS" } }),
        db.attendance.findMany({
          where: { date: today },
          include: {
            user: {
              select: { id: true, name: true, email: true, position: true, avatar: true },
            },
          },
        }),
        db.activity.findMany({
          where: { createdAt: { gte: weekAgo } },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
      ])

      // Compute absent: active employees who have no attendance record today
      const employeesWithRecordsToday = await db.attendance.findMany({
        where: { date: today },
        select: { userId: true },
        distinct: ["userId"],
      })
      const presentUserIds = new Set(employeesWithRecordsToday.map((a) => a.userId))
      const activeEmployees = await db.user.findMany({
        where: { active: true, role: "EMPLOYEE" },
        select: { id: true },
      })
      const absentCount = activeEmployees.filter((e) => !presentUserIds.has(e.id)).length

      return ok({
        role: "ADMIN",
        stats: {
          totalUsers,
          totalEmployees,
          presentToday,
          onLeaveToday,
          absentToday: absentCount,
          pendingLeaves,
          totalTasks,
          completedTasks,
          inProgressTasks,
        },
        todayAttendances,
        recentActivities: weekActivities,
      })
    }

    // Employee dashboard stats
    const [
      todayAttendance,
      weekAttendances,
      monthAttendances,
      leaveDays,
      pendingLeaves,
      myTasks,
      myActivities,
    ] = await Promise.all([
      db.attendance.findFirst({
        where: { userId: user.id, date: today },
      }),
      db.attendance.findMany({
        where: { userId: user.id, date: { gte: weekAgo } },
        orderBy: { date: "desc" },
      }),
      db.attendance.findMany({
        where: { userId: user.id, date: { gte: monthAgo } },
        orderBy: { date: "desc" },
      }),
      db.leave.count({ where: { userId: user.id, status: "APPROVED" } }),
      db.leave.findMany({
        where: { userId: user.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      db.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      db.activity.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

    const presentDays = monthAttendances.filter((a) => a.status === "PRESENT").length
    const completedTasks = myTasks.filter((t) => t.status === "COMPLETED").length
    const inProgressTasks = myTasks.filter((t) => t.status === "IN_PROGRESS").length

    // Total worked time this week (seconds)
    const totalWorkedSecondsWeek = weekAttendances.reduce(
      (sum, a) => sum + (a.totalWorkedSeconds || 0),
      0
    )

    return ok({
      role: "EMPLOYEE",
      stats: {
        presentDaysThisMonth: presentDays,
        leaveDays,
        totalTasks: myTasks.length,
        completedTasks,
        inProgressTasks,
        totalWorkedSecondsWeek,
      },
      todayAttendance,
      weekAttendances,
      tasks: myTasks,
      pendingLeaves,
      recentActivities: myActivities,
    })
  } catch (e) {
    console.error(e)
    return serverError()
  }
}
