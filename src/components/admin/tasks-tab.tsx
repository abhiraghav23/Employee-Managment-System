"use client"

import { useState } from "react"
import { useFetch } from "@/lib/use-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckSquare, PlayCircle, Clock, CheckCircle2 } from "lucide-react"
import { initials, formatDateTime, formatDuration, formatMinutes } from "@/lib/format"

interface Task {
  id: string
  title: string
  description: string | null
  estimatedMinutes: number
  status: string
  startedAt: string | null
  endedAt: string | null
  actualSeconds: number
  createdAt: string
  user: { id: string; name: string; email: string; position: string | null; avatar: string | null }
}

export function TasksTab() {
  const [status, setStatus] = useState("ALL")
  const url = status === "ALL" ? "/api/tasks" : `/api/tasks?status=${status}`
  const { data, loading } = useFetch<Task[]>(url)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tasks</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No tasks found
            </div>
          ) : (
            <ScrollArea className="max-h-[75vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Est.</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-[10px]">
                              {initials(task.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 hidden sm:block">
                            <p className="text-xs font-medium truncate">{task.user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{task.user.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatMinutes(task.estimatedMinutes)}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {task.actualSeconds > 0 ? formatDuration(task.actualSeconds) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {task.startedAt ? formatDateTime(task.startedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {task.endedAt ? formatDateTime(task.endedAt) : "—"}
                      </TableCell>
                      <TableCell>
                        {task.status === "COMPLETED" ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                          </Badge>
                        ) : task.status === "IN_PROGRESS" ? (
                          <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50">
                            <PlayCircle className="h-3 w-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
