"use client"

import { useState } from "react"
import { useFetch, apiPost } from "@/lib/use-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, CalendarOff, Check, X } from "lucide-react"
import { formatDate, formatTimeAgo } from "@/lib/format"
import { toast } from "sonner"

interface Leave {
  id: string
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt: string
}

function countDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  s.setHours(0, 0, 0, 0)
  e.setHours(0, 0, 0, 0)
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1
}

export function MyLeavesTab() {
  const { data: leaves, loading, refetch } = useFetch<Leave[]>("/api/leaves")
  const [open, setOpen] = useState(false)

  const pending = (leaves || []).filter((l) => l.status === "PENDING")
  const approved = (leaves || []).filter((l) => l.status === "APPROVED")
  const rejected = (leaves || []).filter((l) => l.status === "REJECTED")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Request time off and track your leave history.</p>
        <CreateLeaveDialog open={open} onOpenChange={setOpen} onCreated={refetch} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{approved.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-rose-600">{rejected.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !leaves || leaves.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CalendarOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No leave requests</p>
            <p className="text-sm mt-1">Request time off using the button above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...pending, ...approved, ...rejected].map((leave) => (
            <Card key={leave.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {countDays(leave.startDate, leave.endDate)} {countDays(leave.startDate, leave.endDate) === 1 ? "day" : "days"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </span>
                    </div>
                    <p className="text-sm">{leave.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requested {formatTimeAgo(leave.createdAt)}</p>
                  </div>
                  <div className="shrink-0">
                    {leave.status === "PENDING" && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Pending
                      </Badge>
                    )}
                    {leave.status === "APPROVED" && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        <Check className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {leave.status === "REJECTED" && (
                      <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateLeaveDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const today = new Date().toISOString().split("T")[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date")
      return
    }
    setLoading(true)
    try {
      await apiPost("/api/leaves", { startDate, endDate, reason })
      toast.success("Leave request submitted!")
      setReason("")
      setStartDate(today)
      setEndDate(today)
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>Submit a leave request for approval by your administrator.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe the reason for your leave..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
