"use client"

import { useState } from "react"
import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell"
import { ClockWidget } from "@/components/employee/clock-widget"
import { TasksWidget } from "@/components/employee/tasks-widget"
import { MyAttendanceTab } from "@/components/employee/my-attendance-tab"
import { MyLeavesTab } from "@/components/employee/my-leaves-tab"
import { EmployeeOverview } from "@/components/employee/employee-overview"
import { LayoutDashboard, Clock, CheckSquare, CalendarClock, CalendarOff } from "lucide-react"

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clock", label: "Time Clock", icon: Clock },
  { id: "tasks", label: "My Tasks", icon: CheckSquare },
  { id: "attendance", label: "My Attendance", icon: CalendarClock },
  { id: "leaves", label: "Leave Requests", icon: CalendarOff },
]

export function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleLabel="Employee"
    >
      {activeTab === "overview" && <EmployeeOverview onNavigate={setActiveTab} />}
      {activeTab === "clock" && <ClockWidget />}
      {activeTab === "tasks" && <TasksWidget />}
      {activeTab === "attendance" && <MyAttendanceTab />}
      {activeTab === "leaves" && <MyLeavesTab />}
    </DashboardShell>
  )
}
