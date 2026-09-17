"use client"

import { useFetch } from "@/lib/use-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarCheck, CalendarOff } from "lucide-react"
import { formatDate, formatTime, formatDuration } from "@/lib/format"

interface AttendanceRecord {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  totalWorkedSeconds: number
  pausedSeconds: number
  isPaused: boolean
}

export function MyAttendanceTab() {
  const { data, loading } = useFetch<{ role: string; weekAttendances: AttendanceRecord[] }>(
    "/api/dashboard"
  )

  const records = data?.weekAttendances || []
  const presentCount = records.filter((r) => r.status === "PRESENT").length
  const leaveCount = records.filter((r) => r.status === "LEAVE").length
  const totalWorked = records.reduce((sum, r) => sum + (r.totalWorkedSeconds || 0), 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Present Days</span>
            </div>
            <p className="text-2xl font-bold">{presentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <CalendarOff className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Leave Days</span>
            </div>
            <p className="text-2xl font-bold">{leaveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-muted-foreground">Total Worked</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(totalWorked)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No attendance records yet
            </div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Worked</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-sm font-medium">
                        {formatDate(rec.date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short" })}
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
                                : "text-emerald-600 border-emerald-200"
                              : rec.status === "LEAVE"
                              ? "text-amber-600 border-amber-200"
                              : "text-muted-foreground"
                          }
                        >
                          {rec.status}
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
