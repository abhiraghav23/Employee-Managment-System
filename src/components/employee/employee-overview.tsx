"use client"

import { useFetch } from "@/lib/use-fetch"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CalendarCheck,
  CalendarOff,
  CheckSquare,
  Clock,
  PlayCircle,
  Timer,
  ArrowRight,
  Activity as ActivityIcon,
} from "lucide-react"
import { formatTimeAgo, formatDuration, formatMinutes, formatLiveTimer } from "@/lib/format"

interface EmployeeDashboardData {
  role: string
  stats: {
    presentDaysThisMonth: number
    leaveDays: number
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    totalWorkedSecondsWeek: number
  }
  todayAttendance: {
    id: string
    clockIn: string | null
    clockOut: string | null
    status: string
    totalWorkedSeconds: number
    isPaused: boolean
    lastActiveAt: string | null
  } | null
  weekAttendances: Array<{
    id: string
    date: string
    clockIn: string | null
    clockOut: string | null
    status: string
    totalWorkedSeconds: number
    pausedSeconds: number
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    estimatedMinutes: number
    actualSeconds: number
    startedAt: string | null
  }>
  pendingLeaves: Array<{
    id: string
    startDate: string
    endDate: string
    reason: string
    status: string
  }>
  recentActivities: Array<{
    id: string
    type: string
    description: string
    createdAt: string
  }>
}

export function EmployeeOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, loading } = useFetch<EmployeeDashboardData>("/api/dashboard")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { stats, todayAttendance, tasks, recentActivities, pendingLeaves } = data
  const activeTask = tasks.find((t) => t.status === "IN_PROGRESS")

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Present This Month"
          value={stats.presentDaysThisMonth}
          icon={CalendarCheck}
          accent="emerald"
        />
        <StatCard
          label="Leave Days"
          value={stats.leaveDays}
          icon={CalendarOff}
          accent="amber"
        />
        <StatCard
          label="Tasks Completed"
          value={stats.completedTasks}
          icon={CheckSquare}
          accent="teal"
          subtitle={`${stats.inProgressTasks} active`}
        />
        <StatCard
          label="Worked This Week"
          value={formatDuration(stats.totalWorkedSecondsWeek)}
          icon={Clock}
          accent="cyan"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today status / Quick clock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("clock")}>
              Open Clock <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      todayAttendance.clockOut
                        ? "text-violet-600 border-violet-200 bg-violet-50"
                        : todayAttendance.isPaused
                        ? "text-amber-600 border-amber-200 bg-amber-50"
                        : "text-emerald-600 border-emerald-200 bg-emerald-50"
                    }
                  >
                    {todayAttendance.clockOut
                      ? "Completed"
                      : todayAttendance.isPaused
                      ? "On Break"
                      : "Working"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Worked</p>
                    <p className="text-lg font-bold font-mono">
                      {formatDuration(todayAttendance.totalWorkedSeconds)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Clock In</p>
                    <p className="text-lg font-bold">
                      {todayAttendance.clockIn
                        ? new Date(todayAttendance.clockIn).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground mb-3">You haven&apos;t clocked in today</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onNavigate("clock")}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Go to Clock
                </Button>
              </div>
            )}

            {/* Active task */}
            {activeTask && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm font-medium">{activeTask.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate("tasks")}>
                    View
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("attendance")}>
              History <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-72">
              <div className="space-y-1">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  recentActivities.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg text-sm">
                      <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pending leaves */}
      {pendingLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{leave.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(leave.startDate).toLocaleDateString()} -{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    Awaiting approval
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
