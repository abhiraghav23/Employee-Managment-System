import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "System Admin",
      password: adminPassword,
      role: "ADMIN",
      position: "Administrator",
      phone: "+1-555-0100",
    },
  })
  console.log("Admin created:", admin.email)

  // Create sample employees
  const empPassword = await bcrypt.hash("employee123", 10)
  const employees = [
    { name: "John Smith", email: "john@company.com", position: "Software Engineer", phone: "+1-555-0101" },
    { name: "Emily Johnson", email: "emily@company.com", position: "Product Manager", phone: "+1-555-0102" },
    { name: "Michael Brown", email: "michael@company.com", position: "UX Designer", phone: "+1-555-0103" },
    { name: "Sarah Davis", email: "sarah@company.com", position: "QA Engineer", phone: "+1-555-0104" },
    { name: "David Wilson", email: "david@company.com", position: "DevOps Engineer", phone: "+1-555-0105" },
  ]

  for (const emp of employees) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        ...emp,
        password: empPassword,
        role: "EMPLOYEE",
      },
    })
    console.log("Employee created:", user.email)
  }

  // Create some sample attendance records for the past few days for John
  const john = await prisma.user.findUnique({ where: { email: "john@company.com" } })
  if (john) {
    const now = new Date()
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const clockIn = new Date(date)
      clockIn.setHours(9, Math.floor(Math.random() * 30), 0, 0)

      const clockOut = new Date(date)
      clockOut.setHours(17, Math.floor(Math.random() * 45), 0, 0)

      const workedMs = clockOut.getTime() - clockIn.getTime()
      const workedSeconds = Math.floor(workedMs / 1000) - 1800 // subtract 30 min break

      await prisma.attendance.create({
        data: {
          userId: john.id,
          date,
          clockIn,
          clockOut,
          status: "PRESENT",
          totalWorkedSeconds: workedSeconds,
          pausedSeconds: 1800,
        },
      })
    }
    console.log("Sample attendance created for John")
  }

  // Create some sample tasks for John
  if (john) {
    await prisma.task.createMany({
      data: [
        {
          userId: john.id,
          title: "Setup project repository",
          description: "Initialize git repo and configure CI/CD",
          estimatedMinutes: 120,
          status: "COMPLETED",
          actualSeconds: 7200,
          startedAt: new Date(Date.now() - 86400000 * 2),
          endedAt: new Date(Date.now() - 86400000 * 2 + 7200000),
        },
        {
          userId: john.id,
          title: "Code review for auth module",
          description: "Review PR #142 for the authentication module",
          estimatedMinutes: 45,
          status: "COMPLETED",
          actualSeconds: 3600,
          startedAt: new Date(Date.now() - 86400000),
          endedAt: new Date(Date.now() - 86400000 + 3600000),
        },
        {
          userId: john.id,
          title: "Fix login bug",
          description: "Investigate and fix the session timeout issue",
          estimatedMinutes: 60,
          status: "PENDING",
        },
      ],
    })
    console.log("Sample tasks created for John")
  }

  // Create sample activities
  if (john) {
    await prisma.activity.createMany({
      data: [
        { userId: john.id, type: "LOGIN", description: "John Smith logged in" },
        { userId: john.id, type: "CLOCK_IN", description: "John Smith clocked in" },
        { userId: john.id, type: "TASK_CREATE", description: "Created task: Fix login bug" },
      ],
    })
  }

  console.log("Seed completed successfully!")
  console.log("")
  console.log("Login credentials:")
  console.log("  Admin:    admin@company.com / admin123")
  console.log("  Employee: john@company.com / employee123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
