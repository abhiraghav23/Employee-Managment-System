"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Play,
  Pause,
  Square,
  Timer,
  Coffee,
  CheckCircle2,
  LogIn,
} from "lucide-react"
import { apiPost, apiPatch } from "@/lib/use-fetch"
import { formatLiveTimer, formatDuration, formatTime, formatDateTime } from "@/lib/format"
import { toast } from "sonner"

interface TodayData {
  attendance: {
    id: string
    clockIn: string | null
    clockOut: string | null
    status: string
    totalWorkedSeconds: number
    pausedSeconds: number
    isPaused: boolean
    pauseStartedAt: string | null
    lastActiveAt: string | null
  } | null
  isClockedIn: boolean
  isPaused: boolean
  liveWorkedSeconds: number
  livePausedSeconds: number
}

export function ClockWidget() {
  const { data: session } = useSession()
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/today")
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  // Live ticker
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Compute live times based on stored timestamps
  function computeLiveTimes() {
    if (!data?.attendance) return { worked: 0, paused: 0 }
    const att = data.attendance
    if (!att.clockIn || att.clockOut) {
      return {
        worked: att.totalWorkedSeconds || 0,
        paused: att.pausedSeconds || 0,
      }
    }

    let worked = att.totalWorkedSeconds || 0
    let paused = att.pausedSeconds || 0

    if (att.isPaused && att.pauseStartedAt) {
      // Currently paused - worked is frozen, paused is accumulating
      paused += Math.max(0, Math.floor((now - new Date(att.pauseStartedAt).getTime()) / 1000))
    } else if (att.lastActiveAt) {
      // Working - worked is accumulating
      worked += Math.max(0, Math.floor((now - new Date(att.lastActiveAt).getTime()) / 1000))
    }

    return { worked, paused }
  }

  async function handleClockIn() {
    setActionLoading(true)
    try {
      await apiPost("/api/attendance/today")
      toast.success("Clocked in successfully!")
      await fetchToday()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clock in")
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePause() {
    setActionLoading(true)
    try {
      await apiPatch("/api/attendance/today", { action: "pause" })
      toast.success("Work paused")
      await fetchToday()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to pause")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleResume() {
    setActionLoading(true)
    try {
      await apiPatch("/api/attendance/today", { action: "resume" })
      toast.success("Work resumed")
      await fetchToday()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClockOut() {
    setActionLoading(true)
    try {
      await apiPatch("/api/attendance/today", { action: "clock_out" })
      toast.success("Clocked out. Great work today!")
      await fetchToday()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clock out")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  const { worked, paused } = computeLiveTimes()
  const att = data?.attendance
  const isClockedIn = data?.isClockedIn ?? false
  const isPaused = data?.isPaused ?? false
  const isClockedOut = !!att?.clockOut

  let statusLabel = "Not Clocked In"
  let statusColor = "text-muted-foreground"
  let statusBg = "bg-muted"
  if (isClockedOut) {
    statusLabel = "Day Complete"
    statusColor = "text-violet-600"
    statusBg = "bg-violet-50 dark:bg-violet-950"
  } else if (isPaused) {
    statusLabel = "On Break"
    statusColor = "text-amber-600"
    statusBg = "bg-amber-50 dark:bg-amber-950"
  } else if (isClockedIn) {
    statusLabel = "Working"
    statusColor = "text-emerald-600"
    statusBg = "bg-emerald-50 dark:bg-emerald-950"
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Main clock card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${isClockedIn ? (isPaused ? "bg-amber-500" : "bg-emerald-500") : "bg-muted"}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Time Clock</CardTitle>
            <Badge variant="outline" className={`${statusColor} ${statusBg} border-0`}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Live timer */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Timer className={`h-5 w-5 ${statusColor}`} />
              <span className="text-sm text-muted-foreground">Worked Time</span>
            </div>
            <div className={`text-6xl font-mono font-bold tracking-tight ${statusColor}`}>
              {formatLiveTimer(worked)}
            </div>
            {att?.clockIn && (
              <p className="text-xs text-muted-foreground mt-3">
                Started at {formatTime(att.clockIn)}
                {att.clockOut && ` · Ended at ${formatTime(att.clockOut)}`}
              </p>
            )}
          </div>

          {/* Pause time display */}
          {isClockedIn && paused > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
              <Coffee className="h-4 w-4" />
              <span>Break time: {formatLiveTimer(paused)}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isClockedIn && !isClockedOut && (
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 text-base"
                onClick={handleClockIn}
                disabled={actionLoading}
              >
                <LogIn className="h-5 w-5 mr-2" />
                Clock In
              </Button>
            )}

            {isClockedIn && !isClockedOut && (
              <>
                {!isPaused ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-6 border-amber-300 text-amber-600 hover:bg-amber-50"
                    onClick={handlePause}
                    disabled={actionLoading}
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="h-14 px-6 bg-teal-600 hover:bg-teal-700"
                    onClick={handleResume}
                    disabled={actionLoading}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-6 text-rose-600 border-rose-300 hover:bg-rose-50"
                  onClick={handleClockOut}
                  disabled={actionLoading}
                >
                  <Square className="h-5 w-5 mr-2" />
                  Clock Out
                </Button>
              </>
            )}

            {isClockedOut && (
              <div className="flex items-center justify-center gap-2 text-violet-600 py-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>You&apos;ve completed your work day.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Total Worked</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(worked)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Total Break</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(paused)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Session info */}
      {att && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Clock In</p>
                <p className="font-medium">{att.clockIn ? formatDateTime(att.clockIn) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clock Out</p>
                <p className="font-medium">{att.clockOut ? formatDateTime(att.clockOut) : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Work Time</p>
                <p className="font-medium">{formatDuration(att.totalWorkedSeconds)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Break Time</p>
                <p className="font-medium">{formatDuration(att.pausedSeconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
