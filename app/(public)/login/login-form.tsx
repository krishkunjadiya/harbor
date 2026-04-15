"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeSlash, SpinnerGap } from "@phosphor-icons/react/dist/ssr"
import { useRouter, useSearchParams } from "next/navigation"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("student")
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const logoutMarkerKey = 'harbor:auth:logout-marker'
    const marker = sessionStorage.getItem(logoutMarkerKey)
    const loggedOut = searchParams?.get('loggedOut')
    const redirectTo = searchParams?.get('redirectTo')

    if (marker) {
      sessionStorage.removeItem(logoutMarkerKey)
    }

    if (loggedOut) {
      router.replace('/login')
      return
    }

    if (marker && redirectTo) {
      router.replace('/login')
    }
  }, [router, searchParams])
  
  // Clear error and form when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError("")
    setEmail("")
    setPassword("")
    setShowPassword(false)
  }
  
  const handleLogin = async (e: React.FormEvent, userType: string) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError, userType: actualUserType, redirectPath } = await signIn(email, password, userType)

      if (signInError) {
        // Check for common error messages and provide helpful feedback
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for the confirmation link.')
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else {
          setError(signInError.message)
        }
        setIsLoading(false)
        return
      }
      
      // Redirect based on user type or redirectTo param
      const redirectTo = searchParams?.get('redirectTo')
      const safeRedirectTo = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : null

      if (safeRedirectTo) {
        router.push(safeRedirectTo)
      } else if (redirectPath) {
        router.push(redirectPath)
      } else {
        // Default redirects based on actual user type from database
        switch (actualUserType) {
          case 'student':
            router.push('/student/dashboard')
            break
          case 'faculty':
            router.push('/ppsu/faculty/dashboard')
            break
          case 'university':
            router.push('/ppsu/admin/dashboard')
            break
          case 'recruiter':
            router.push('/techcorp/dashboard')
            break
          default:
            router.push('/dashboard')
        }
      }
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="student" value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="student">Student</TabsTrigger>
        <TabsTrigger value="university">University</TabsTrigger>
        <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
      </TabsList>

      {/* Student Login */}
      <TabsContent value="student">
        <Card>
          <CardHeader>
            <CardTitle>Student Login</CardTitle>
            <CardDescription>Access your student portal</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive border border-destructive/30 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={(e) => handleLogin(e, 'student')} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-email">Email</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword && <EyeSlash className="h-4 w-4" />}
                    {!showPassword && <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Need a student account? Please contact your university administrator.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* University Login */}
      <TabsContent value="university">
        <Card>
          <CardHeader>
            <CardTitle>University Login</CardTitle>
            <CardDescription>Access your institution's portal (Admin & Faculty)</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive border border-destructive/30 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={(e) => handleLogin(e, 'university')} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university-email">Email</Label>
                <Input
                  id="university-email"
                  type="email"
                  placeholder="email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="university-password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="university-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword && <EyeSlash className="h-4 w-4" />}
                    {!showPassword && <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register?type=university" className="text-primary hover:underline font-medium">
                Register your institution
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Recruiter Login */}
      <TabsContent value="recruiter">
        <Card>
          <CardHeader>
            <CardTitle>Recruiter Login</CardTitle>
            <CardDescription>Access your recruiting dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive border border-destructive/30 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={(e) => handleLogin(e, 'recruiter')} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recruiter-email">Email</Label>
                <Input
                  id="recruiter-email"
                  type="email"
                  placeholder="recruiter@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="recruiter-password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="recruiter-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword && <EyeSlash className="h-4 w-4" />}
                    {!showPassword && <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/register?type=recruiter" className="text-primary hover:underline font-medium">
                Sign up as a recruiter
              </Link>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
