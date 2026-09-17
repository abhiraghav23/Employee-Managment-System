"use client"

import { useState, useEffect, useRef } from "react"
import { useFetch, apiPost, apiPatch, apiDelete } from "@/lib/use-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Clock,
  Timer,
  Pencil,
} from "lucide-react"
import { formatLiveTimer, formatDuration, formatMinutes, formatTimeAgo, formatDateTime } from "@/lib/format"
import { toast } from "sonner"

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
}

export function TasksWidget() {
  const { data: tasks, loading, refetch } = useFetch<Task[]>("/api/tasks")
  const [createOpen, setCreateOpen] = useState(false)
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Live tick for in-progress tasks
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function liveActualSeconds(task: Task): number {
    if (task.status === "IN_PROGRESS" && task.startedAt) {
      return Math.floor((now - new Date(task.startedAt).getTime()) / 1000)
    }
    return task.actualSeconds
  }

  const pending = (tasks || []).filter((t) => t.status === "PENDING")
  const inProgress = (tasks || []).filter((t) => t.status === "IN_PROGRESS")
  const completed = (tasks || []).filter((t) => t.status === "COMPLETED")

  async function handleStart(id: string) {
    try {
      await apiPatch(`/api/tasks/${id}`, { action: "start" })
      toast.success("Task started! Timer is now running.")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start task")
    }
  }

  async function handleEnd(id: string) {
    try {
      await apiPatch(`/api/tasks/${id}`, { action: "end" })
      toast.success("Task completed!")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to end task")
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/tasks/${id}`)
      toast.success("Task deleted")
      refetch()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete task")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create tasks with estimated time. When you start a task, the timer syncs with your work clock.
        </p>
        <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          {/* In Progress */}
          {inProgress.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                <Timer className="h-4 w-4" />
                In Progress ({inProgress.length})
              </h3>
              <div className="grid gap-3">
                {inProgress.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    liveSeconds={liveActualSeconds(task)}
                    onEnd={handleEnd}
                    onDelete={handleDelete}
                    onUpdated={refetch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pending.length})
              </h3>
              <div className="grid gap-3">
                {pending.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    liveSeconds={task.actualSeconds}
                    onStart={handleStart}
                    onDelete={handleDelete}
                    onUpdated={refetch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({completed.length})
              </h3>
              <div className="grid gap-3">
                {completed.slice(0, 10).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    liveSeconds={task.actualSeconds}
                    onDelete={handleDelete}
                    onUpdated={refetch}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && tasks?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm mt-1">Create your first task to get started.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function TaskCard({
  task,
  liveSeconds,
  onStart,
  onEnd,
  onDelete,
  onUpdated,
}: {
  task: Task
  liveSeconds: number
  onStart?: (id: string) => void
  onEnd?: (id: string) => void
  onDelete: (id: string) => void
  onUpdated: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const isInProgress = task.status === "IN_PROGRESS"
  const isCompleted = task.status === "COMPLETED"

  // Calculate time difference vs estimate
  const estimatedSeconds = task.estimatedMinutes * 60
  const overEstimate = isCompleted && task.actualSeconds > estimatedSeconds && estimatedSeconds > 0
  const underEstimate = isCompleted && task.actualSeconds <= estimatedSeconds && estimatedSeconds > 0

  return (
    <Card className={isInProgress ? "border-cyan-300 bg-cyan-50/30 dark:bg-cyan-950/20" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{task.title}</h4>
              {isInProgress && (
                <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50 dark:bg-cyan-950">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse mr-1" />
                  Active
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}

            {/* Time info */}
            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Est:</span>
                <span className="font-medium">{formatMinutes(task.estimatedMinutes)}</span>
              </div>

              {(isInProgress || isCompleted) && (
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Actual:</span>
                  <span
                    className={`font-mono font-medium ${
                      isInProgress
                        ? "text-cyan-600"
                        : overEstimate
                        ? "text-rose-600"
                        : underEstimate
                        ? "text-emerald-600"
                        : ""
                    }`}
                  >
                    {formatLiveTimer(liveSeconds)}
                  </span>
                </div>
              )}

              {isCompleted && task.estimatedMinutes > 0 && (
                <Badge
                  variant="outline"
                  className={
                    overEstimate
                      ? "text-rose-600 border-rose-200 bg-rose-50"
                      : "text-emerald-600 border-emerald-200 bg-emerald-50"
                  }
                >
                  {overEstimate ? "+" : ""}
                  {formatDuration(Math.abs(liveSeconds - estimatedSeconds))}
                  {overEstimate ? " over" : " under"}
                </Badge>
              )}

              {task.startedAt && (
                <span className="text-xs text-muted-foreground">
                  Started {formatTimeAgo(task.startedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isInProgress && onEnd && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onEnd(task.id)}>
                <Square className="h-3.5 w-3.5 mr-1" />
                End
              </Button>
            )}
            {!isInProgress && !isCompleted && onStart && (
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={() => onStart(task.id)}>
                <Play className="h-3.5 w-3.5 mr-1" />
                Start
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>

      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} onUpdated={onUpdated} />
    </Card>
  )
}

function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [hours, setHours] = useState("0")
  const [minutes, setMinutes] = useState("0")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }
    const estimatedMinutes = Number(hours) * 60 + Number(minutes)
    setLoading(true)
    try {
      await apiPost("/api/tasks", {
        title,
        description,
        estimatedMinutes,
      })
      toast.success("Task created!")
      setTitle("")
      setDescription("")
      setHours("0")
      setMinutes("0")
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Set an estimated time. The actual time will be tracked when you start the task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design homepage mockup"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Estimated Time</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="est-hours" className="text-xs text-muted-foreground">Hours</Label>
                <Input
                  id="est-hours"
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="est-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                <Input
                  id="est-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onUpdated,
}: {
  task: Task
  open: boolean
  onOpenChange: (v: boolean) => void
  onUpdated: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [hours, setHours] = useState(String(Math.floor(task.estimatedMinutes / 60)))
  const [minutes, setMinutes] = useState(String(task.estimatedMinutes % 60))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const estimatedMinutes = Number(hours) * 60 + Number(minutes)
    setLoading(true)
    try {
      await apiPatch(`/api/tasks/${task.id}`, {
        action: "update",
        title,
        description,
        estimatedMinutes,
      })
      toast.success("Task updated")
      onOpenChange(false)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details and estimated time.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Estimated Time</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="edit-hours" className="text-xs text-muted-foreground">Hours</Label>
                <Input id="edit-hours" type="number" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label htmlFor="edit-minutes" className="text-xs text-muted-foreground">Minutes</Label>
                <Input id="edit-minutes" type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              </div>
            </div>
          </div>
          {task.status === "COMPLETED" && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started:</span>
                <span>{task.startedAt ? formatDateTime(task.startedAt) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ended:</span>
                <span>{task.endedAt ? formatDateTime(task.endedAt) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actual time:</span>
                <span className="font-medium">{formatDuration(task.actualSeconds)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
