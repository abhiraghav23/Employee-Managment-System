"use client"

import { useState } from "react"
import { useFetch } from "@/lib/use-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, RefreshCw } from "lucide-react"
import { initials, formatDate, formatTime, formatDuration } from "@/lib/format"

interface AttendanceRecord {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  totalWorkedSeconds: number
  pausedSeconds: number
  isPaused: boolean
  user: { id: string; name: string; email: string; position: string | null; avatar: string | null }
}

export function AttendanceTab() {
  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(today)
  const { data, loading, refetch } = useFetch<AttendanceRecord[]>(`/api/attendance/all?date=${date}`)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
              No attendance records for {formatDate(date)}
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Worked</TableHead>
                    <TableHead>Paused</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                              {initials(rec.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{rec.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{rec.user.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.clockIn ? formatTime(rec.clockIn) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.clockOut ? formatTime(rec.clockOut) : rec.isPaused ? "Paused" : "Active"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {formatDuration(rec.totalWorkedSeconds)}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {rec.pausedSeconds > 0 ? formatDuration(rec.pausedSeconds) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            rec.status === "PRESENT"
                              ? rec.clockOut
                                ? "text-muted-foreground"
                                : rec.isPaused
                                ? "text-amber-600 border-amber-200"
                                : "text-emerald-600 border-emerald-200"
                              : rec.status === "LEAVE"
                              ? "text-amber-600 border-amber-200"
                              : "text-muted-foreground"
                          }
                        >
                          {rec.status === "PRESENT"
                            ? rec.clockOut
                              ? "Completed"
                              : rec.isPaused
                              ? "Paused"
                              : "Working"
                            : rec.status}
                        </Badge>
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
