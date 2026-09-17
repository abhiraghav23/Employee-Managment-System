"use client"

import { useState } from "react"
import { useFetch, apiPost, apiPatch } from "@/lib/use-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, Shield, Mail, Phone, Briefcase, Calendar, Activity, CheckSquare, Clock } from "lucide-react"
import { initials, formatDate, formatDateTime, formatTimeAgo, formatDuration, formatMinutes } from "@/lib/format"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  phone: string | null
  avatar: string | null
  active: boolean
  createdAt: string
}

interface UserDetail {
  user: User
  stats: {
    presentDays: number
    leaveDays: number
    totalTasks: number
  }
  activities: Array<{
    id: string
    type: string
    description: string
    metadata: string | null
    createdAt: string
  }>
  attendances: Array<{
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
    endedAt: string | null
  }>
}

export function EmployeesTab() {
  const { data: users, loading, refetch } = useFetch<User[]>("/api/users")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = (users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.position || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
      </div>

      {/* Employee grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedId(user.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback
                      className={
                        user.role === "ADMIN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-teal-100 text-teal-700"
                      }
                    >
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      {user.role === "ADMIN" && (
                        <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.position || "No position set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline" className="text-xs">
                    {user.role === "ADMIN" ? "Administrator" : "Employee"}
                  </Badge>
                  {!user.active && (
                    <Badge variant="outline" className="text-xs text-rose-600 border-rose-200">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No employees found.
          </CardContent>
        </Card>
      )}

      {/* User detail dialog */}
      <UserDetailDialog userId={selectedId} onClose={() => setSelectedId(null)} onUpdated={refetch} />
    </div>
  )
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("EMPLOYEE")
  const [position, setPosition] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required")
      return
    }
    setLoading(true)
    try {
      await apiPost("/api/users", { name, email, password, role, position, phone })
      toast.success("User created successfully")
      setName("")
      setEmail("")
      setPassword("")
      setRole("EMPLOYEE")
      setPosition("")
      setPhone("")
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new employee or admin to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Software Engineer" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UserDetailDialog({
  userId,
  onClose,
  onUpdated,
}: {
  userId: string | null
  onClose: () => void
  onUpdated: () => void
}) {
  const { data, loading, refetch } = useFetch<UserDetail>(userId ? `/api/users/${userId}` : null)
  const [editOpen, setEditOpen] = useState(false)

  if (!userId) return null

  return (
    <Dialog open={!!userId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {loading || !data ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback
                    className={
                      data.user.role === "ADMIN"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-teal-100 text-teal-700"
                    }
                  >
                    {initials(data.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    {data.user.name}
                    {data.user.role === "ADMIN" && (
                      <Shield className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-sm font-normal text-muted-foreground">{data.user.email}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{data.user.position || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{data.user.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{data.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined {formatDate(data.user.createdAt)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{data.stats.presentDays}</div>
                <div className="text-xs text-muted-foreground">Present Days</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{data.stats.leaveDays}</div>
                <div className="text-xs text-muted-foreground">Leave Days</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold text-teal-600">{data.stats.totalTasks}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="activity" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity">
                  <Activity className="h-3.5 w-3.5 mr-1.5" /> Activity
                </TabsTrigger>
                <TabsTrigger value="attendance">
                  <Clock className="h-3.5 w-3.5 mr-1.5" /> Attendance
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" /> Tasks
                </TabsTrigger>
              </TabsList>
              <TabsContent value="activity" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-72 pr-3">
                  <div className="space-y-2">
                    {data.activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                    ) : (
                      data.activities.map((a) => (
                        <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg border text-sm">
                          <div className="min-w-0 flex-1">
                            <p>{a.description}</p>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(a.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="attendance" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-72 pr-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>In</TableHead>
                        <TableHead>Out</TableHead>
                        <TableHead>Worked</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.attendances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No attendance records
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.attendances.map((att) => (
                          <TableRow key={att.id}>
                            <TableCell className="text-xs">{formatDate(att.date)}</TableCell>
                            <TableCell className="text-xs">{att.clockIn ? formatDateTime(att.clockIn) : "—"}</TableCell>
                            <TableCell className="text-xs">{att.clockOut ? formatDateTime(att.clockOut) : "—"}</TableCell>
                            <TableCell className="text-xs">{formatDuration(att.totalWorkedSeconds)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  att.status === "PRESENT"
                                    ? "text-emerald-600 border-emerald-200"
                                    : att.status === "LEAVE"
                                    ? "text-amber-600 border-amber-200"
                                    : "text-muted-foreground"
                                }
                              >
                                {att.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="tasks" className="flex-1 overflow-hidden mt-2">
                <ScrollArea className="h-72 pr-3">
                  <div className="space-y-2">
                    {data.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
                    ) : (
                      data.tasks.map((t) => (
                        <div key={t.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{t.title}</p>
                            <Badge
                              variant="outline"
                              className={
                                t.status === "COMPLETED"
                                  ? "text-emerald-600 border-emerald-200"
                                  : t.status === "IN_PROGRESS"
                                  ? "text-cyan-600 border-cyan-200"
                                  : "text-muted-foreground"
                              }
                            >
                              {t.status === "IN_PROGRESS" ? "In Progress" : t.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Est: {formatMinutes(t.estimatedMinutes)}</span>
                            {t.actualSeconds > 0 && <span>Actual: {formatDuration(t.actualSeconds)}</span>}
                            {t.endedAt && <span>Done {formatTimeAgo(t.endedAt)}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <EditUserDialog
              user={data.user}
              open={editOpen}
              onOpenChange={setEditOpen}
              onUpdated={() => {
                refetch()
                onUpdated()
              }}
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit User
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUpdated,
}: {
  user: User
  open: boolean
  onOpenChange: (v: boolean) => void
  onUpdated: () => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [position, setPosition] = useState(user.position || "")
  const [phone, setPhone] = useState(user.phone || "")
  const [active, setActive] = useState(user.active)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiPatch(`/api/users/${user.id}`, {
        name,
        email,
        role,
        position,
        phone,
        active,
        password: password || undefined,
      })
      toast.success("User updated successfully")
      setPassword("")
      onOpenChange(false)
      onUpdated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information. Leave password blank to keep current.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-position">Position</Label>
            <Input id="edit-position" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password (optional)</Label>
            <Input id="edit-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="edit-active" className="text-sm font-normal cursor-pointer">
              Account active
            </Label>
          </div>
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
