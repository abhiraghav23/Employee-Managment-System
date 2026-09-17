"use client"

import { useState } from "react"
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell"
import { OverviewTab } from "@/components/admin/overview-tab"
import { EmployeesTab } from "@/components/admin/employees-tab"
import { AttendanceTab } from "@/components/admin/attendance-tab"
import { ActivitiesTab } from "@/components/admin/activities-tab"
import { LeavesTab } from "@/components/admin/leaves-tab"
import { TasksTab } from "@/components/admin/tasks-tab"
import { LayoutDashboard, Users, CalendarClock, Activity, CalendarOff, CheckSquare } from "lucide-react"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "attendance", label: "Attendance", icon: CalendarClock },
  { id: "tasks", label: "All Tasks", icon: CheckSquare },
  { id: "leaves", label: "Leave Requests", icon: CalendarOff },
  { id: "activities", label: "Activity Log", icon: Activity },
]

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleLabel="Administrator"
    >
      {activeTab === "overview" && <OverviewTab onNavigate={setActiveTab} />}
      {activeTab === "employees" && <EmployeesTab />}
      {activeTab === "attendance" && <AttendanceTab />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "leaves" && <LeavesTab />}
      {activeTab === "activities" && <ActivitiesTab />}
    </DashboardShell>
  )
}
