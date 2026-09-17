"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Shield, User, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
        setLoading(false)
        return
      }

      toast.success("Welcome back!")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function fillDemo(type: "admin" | "employee") {
    if (type === "admin") {
      setEmail("admin@company.com")
      setPassword("admin123")
    } else {
      setEmail("john@company.com")
      setPassword("employee123")
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">WorkTrack</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            Employee Management, <br /> Simplified.
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Track attendance, manage tasks, monitor activity, and streamline your workforce — all in one place.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-12">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-xs text-white/70">Live tracking</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">Real-time</div>
            <div className="text-xs text-white/70">Activity feed</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="text-2xl font-bold">Smart</div>
            <div className="text-xs text-white/70">Task sync</div>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Try a demo account:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fillDemo("admin")}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs font-medium">Admin</span>
                    <span className="text-[10px] text-muted-foreground">Full access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo("employee")}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <User className="h-5 w-5 text-teal-600" />
                    <span className="text-xs font-medium">Employee</span>
                    <span className="text-[10px] text-muted-foreground">Daily tracking</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            WorkTrack Employee Management System
          </p>
        </div>
      </div>
    </div>
  )
}
