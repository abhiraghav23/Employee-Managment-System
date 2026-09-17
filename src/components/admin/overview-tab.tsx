"use client"

import { useFetch } from "@/lib/use-fetch"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  UserCheck,
  CalendarOff,
  CheckSquare,
  Clock,
  Activity as ActivityIcon,
  PlayCircle,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { formatTimeAgo, formatTime, initials, formatDuration } from "@/lib/format"

interface DashboardData {
  role: string
  stats: {
    totalUsers: number
    totalEmployees: number
    presentToday: number
    onLeaveToday: number
    absentToday: number
    pendingLeaves: number
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
  }
  todayAttendances: Array<{
    id: string
    status: string
    clockIn: string | null
    clockOut: string | null
    totalWorkedSeconds: number
    isPaused: boolean
    user: { id: string; name: string; email: string; position: string | null; avatar: string | null }
  }>
  recentActivities: Array<{
    id: string
    type: string
    description: string
    createdAt: string
    user: { id: string; name: string; email: string; avatar: string | null }
  }>
}

const activityIconMap: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CLOCK_IN: { icon: PlayCircle, color: "text-emerald-600" },
  CLOCK_OUT: { icon: Clock, color: "text-rose-600" },
  PAUSE: { icon: Clock, color: "text-amber-600" },
  RESUME: { icon: PlayCircle, color: "text-teal-600" },
  TASK_START: { icon: CheckSquare, color: "text-cyan-600" },
  TASK_END: { icon: CheckSquare, color: "text-violet-600" },
  TASK_CREATE: { icon: CheckSquare, color: "text-blue-600" },
  LOGIN: { icon: Users, color: "text-emerald-600" },
  LEAVE_REQUEST: { icon: CalendarOff, color: "text-amber-600" },
  USER_CREATE: { icon: Users, color: "text-teal-600" },
}

export function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, loading, refetch } = useFetch<DashboardData>("/api/dashboard")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { stats, todayAttendances, recentActivities } = data

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          accent="emerald"
          subtitle={`${stats.totalUsers} total users`}
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          accent="teal"
          subtitle={`${stats.absentToday} absent`}
        />
        <StatCard
          label="On Leave Today"
          value={stats.onLeaveToday}
          icon={CalendarOff}
          accent="amber"
        />
        <StatCard
          label="Pending Leaves"
          value={stats.pendingLeaves}
          icon={Calendar}
          accent="rose"
        />
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          accent="cyan"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgressTasks}
          icon={PlayCircle}
          accent="violet"
        />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          icon={CheckSquare}
          accent="emerald"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("attendance")}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {todayAttendances.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attendance records today
                  </p>
                ) : (
                  todayAttendances.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                          {initials(att.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{att.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {att.user.position || "Employee"}
                          {att.clockIn && ` · In ${formatTime(att.clockIn)}`}
                          {att.clockOut && ` · Out ${formatTime(att.clockOut)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {att.isPaused && !att.clockOut && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">
                            Paused
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            att.status === "PRESENT"
                              ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                              : att.status === "LEAVE"
                              ? "text-amber-600 border-amber-200 bg-amber-50"
                              : "text-muted-foreground"
                          }
                        >
                          {att.status === "PRESENT" ? (att.clockOut ? "Done" : "Active") : att.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("activities")}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  recentActivities.map((activity) => {
                    const config = activityIconMap[activity.type] || {
                      icon: ActivityIcon,
                      color: "text-muted-foreground",
                    }
                    const Icon = config.icon
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg">
                        <div className={`mt-0.5 ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user?.name} · {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
