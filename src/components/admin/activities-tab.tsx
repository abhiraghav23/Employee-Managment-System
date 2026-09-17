"use client"

import { useState } from "react"
import { useFetch } from "@/lib/use-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  PlayCircle,
  CheckSquare,
  Users,
  CalendarOff,
  Activity as ActivityIcon,
  Pause,
  LogIn,
} from "lucide-react"
import { formatTimeAgo, formatDateTime, initials } from "@/lib/format"

interface Activity {
  id: string
  type: string
  description: string
  metadata: string | null
  createdAt: string
  user: { id: string; name: string; email: string; avatar: string | null }
}

const activityConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  CLOCK_IN: { icon: PlayCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950", label: "Clock In" },
  CLOCK_OUT: { icon: Clock, color: "text-rose-600 bg-rose-50 dark:bg-rose-950", label: "Clock Out" },
  PAUSE: { icon: Pause, color: "text-amber-600 bg-amber-50 dark:bg-amber-950", label: "Pause" },
  RESUME: { icon: PlayCircle, color: "text-teal-600 bg-teal-50 dark:bg-teal-950", label: "Resume" },
  TASK_START: { icon: CheckSquare, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950", label: "Task Start" },
  TASK_END: { icon: CheckSquare, color: "text-violet-600 bg-violet-50 dark:bg-violet-950", label: "Task End" },
  TASK_CREATE: { icon: CheckSquare, color: "text-blue-600 bg-blue-50 dark:bg-blue-950", label: "Task Created" },
  LOGIN: { icon: LogIn, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950", label: "Login" },
  LEAVE_REQUEST: { icon: CalendarOff, color: "text-amber-600 bg-amber-50 dark:bg-amber-950", label: "Leave" },
  USER_CREATE: { icon: Users, color: "text-teal-600 bg-teal-50 dark:bg-teal-950", label: "User" },
  PROFILE_UPDATE: { icon: ActivityIcon, color: "text-muted-foreground bg-muted", label: "Update" },
}

export function ActivitiesTab() {
  const [type, setType] = useState<string>("ALL")
  const url = type === "ALL" ? "/api/activities" : `/api/activities?type=${type}`
  const { data, loading } = useFetch<Activity[]>(url)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Activities</SelectItem>
            <SelectItem value="CLOCK_IN">Clock In</SelectItem>
            <SelectItem value="CLOCK_OUT">Clock Out</SelectItem>
            <SelectItem value="PAUSE">Pause</SelectItem>
            <SelectItem value="RESUME">Resume</SelectItem>
            <SelectItem value="TASK_START">Task Start</SelectItem>
            <SelectItem value="TASK_END">Task End</SelectItem>
            <SelectItem value="TASK_CREATE">Task Created</SelectItem>
            <SelectItem value="LEAVE_REQUEST">Leave Requests</SelectItem>
            <SelectItem value="LOGIN">Logins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No activities found</div>
          ) : (
            <ScrollArea className="max-h-[75vh]">
              <div className="p-4 space-y-1">
                {data.map((activity) => {
                  const config = activityConfig[activity.type] || {
                    icon: ActivityIcon,
                    color: "text-muted-foreground bg-muted",
                    label: activity.type,
                  }
                  const Icon = config.icon
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px] bg-muted">
                              {initials(activity.user?.name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{activity.user?.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(activity.createdAt)} · {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
