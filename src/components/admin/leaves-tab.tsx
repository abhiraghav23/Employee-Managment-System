"use client"

import { useState } from "react"
import { useFetch, apiPatch } from "@/lib/use-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, CalendarOff } from "lucide-react"
import { formatDate, initials } from "@/lib/format"
import { toast } from "sonner"

interface Leave {
  id: string
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt: string
  user: { id: string; name: string; email: string; position: string | null; avatar: string | null }
}

function countDays(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  s.setHours(0, 0, 0, 0)
  e.setHours(0, 0, 0, 0)
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1
}

export function LeavesTab() {
  const [tab, setTab] = useState("pending")
  const url =
    tab === "pending"
      ? "/api/leaves?status=PENDING"
      : tab === "approved"
      ? "/api/leaves?status=APPROVED"
      : tab === "rejected"
      ? "/api/leaves?status=REJECTED"
      : "/api/leaves"
  const { data, loading, refetch } = useFetch<Leave[]>(url)

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await apiPatch(`/api/leaves/${id}`, { status })
      toast.success(`Leave ${status === "APPROVED" ? "approved" : "rejected"}`)
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update leave")
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <CalendarOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
                No leave requests in this category
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {data.map((leave) => {
                const days = countDays(leave.startDate, leave.endDate)
                return (
                  <Card key={leave.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                              {initials(leave.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{leave.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {leave.user.position || "Employee"}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {days} {days === 1 ? "day" : "days"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 line-clamp-2">{leave.reason}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {leave.status === "PENDING" ? (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleAction(leave.id, "APPROVED")}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                onClick={() => handleAction(leave.id, "REJECTED")}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Badge
                              variant="outline"
                              className={
                                leave.status === "APPROVED"
                                  ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                                  : "text-rose-600 border-rose-200 bg-rose-50"
                              }
                            >
                              {leave.status === "APPROVED" ? "Approved" : "Rejected"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
