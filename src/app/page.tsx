"use client"

import { useSession } from "next-auth/react"
import { LoginForm } from "@/components/auth/login-form"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { EmployeeDashboard } from "@/components/employee/employee-dashboard"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading WorkTrack...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  if (session.user.role === "ADMIN") {
    return <AdminDashboard />
  }

  return <EmployeeDashboard />
}
