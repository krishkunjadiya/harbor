"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Eye, EyeSlash, SpinnerGap } from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    major: "",
    graduationYear: "",
    userType: "student",
    // University fields
    universityName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    // Recruiter fields
    company: "",
    jobTitle: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("student")
  const { signUp } = useAuth()
  const router = useRouter()

  // Clear error and success messages when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError("")
    setSuccess("")
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent, userType: string) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    // Build metadata based on user type
    let metadata: any = {
      full_name: `${formData.firstName} ${formData.lastName}`,
      user_type: userType }

    if (userType === 'student') {
      metadata = {
        ...metadata,
        university: formData.university,
        major: formData.major,
        graduation_year: formData.graduationYear }
    } else if (userType === 'university') {
      metadata = {
        ...metadata,
        university_name: formData.universityName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country }
    } else if (userType === 'recruiter') {
      metadata = {
        ...metadata,
        company: formData.company,
        job_title: formData.jobTitle,
        phone: formData.phone }
    }

    const { error: signUpError, user: newUser } = await signUp(
      formData.email,
      formData.password,
      metadata
    )

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
    } else {
      setSuccess("Account created successfully! Redirecting to your dashboard...")
      
      // Redirect based on user type after short delay
      setTimeout(() => {
        switch (userType) {
          case 'student':
            router.push('/student/dashboard')
            break
          case 'university':
            const universitySlug = formData.universityName
              ?.toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '') || 'university'
            router.push(`/${universitySlug}/admin/dashboard`)
            break
          case 'recruiter':
            const companySlug = formData.company
              ?.toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '') || 'company'
            router.push(`/${companySlug}/dashboard`)
            break
          default:
            router.push('/student/dashboard')
        }
        router.refresh()
      }, 1500)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <Link href="/landing" className="text-xl font-bold">Harbor</Link>
          </div>
          <nav className="hidden md:flex items-center justify-self-center gap-6">
            <Link href="/landing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Your Account</h1>
            <p className="text-muted-foreground">Join Harbor and start your journey today</p>
          </div>

          <Tabs defaultValue="student" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="university">University</TabsTrigger>
              <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
            </TabsList>

            {/* Student Registration */}
            <TabsContent value="student">
              <Card>
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                  <CardDescription>Create your student profile and start building your career</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, 'student')} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/30">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-3 rounded-md bg-success/10 text-success text-sm border border-success/30">
                        {success}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-firstname">First Name</Label>
                        <Input
                          id="student-firstname"
                          placeholder="John"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-lastname">Last Name</Label>
                        <Input
                          id="student-lastname"
                          placeholder="Doe"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-email">Email</Label>
                      <Input
                        id="student-email"
                        type="email"
                        placeholder="john.doe@example.com"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-university">University</Label>
                      <Input
                        id="student-university"
                        placeholder="Your university name"
                        value={formData.university}
                        onChange={(e) => updateFormData('university', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="student-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password (min 6 characters)"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          required
                          disabled={isLoading}
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
                    <div className="space-y-2">
                      <Label htmlFor="student-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="student-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          disabled={isLoading}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword && <EyeSlash className="h-4 w-4" />}
                          {!showConfirmPassword && <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="student-terms" required disabled={isLoading} />
                      <label
                        htmlFor="student-terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Student Account'
                      )}
                    </Button>
                  </form>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </Button>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* University Registration */}
            <TabsContent value="university">
              <Card>
                <CardHeader>
                  <CardTitle>University Registration</CardTitle>
                  <CardDescription>Register your institution to manage students and issue credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, 'university')} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/30">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-3 rounded-md bg-success/10 text-success text-sm border border-success/30">
                        {success}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="university-name">University Name</Label>
                      <Input
                        id="university-name"
                        placeholder="Example University"
                        value={formData.universityName}
                        onChange={(e) => updateFormData('universityName', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="university-admin-firstname">Admin First Name</Label>
                        <Input
                          id="university-admin-firstname"
                          placeholder="Jane"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="university-admin-lastname">Admin Last Name</Label>
                        <Input
                          id="university-admin-lastname"
                          placeholder="Smith"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university-email">Institutional Email</Label>
                      <Input
                        id="university-email"
                        type="email"
                        placeholder="admin@university.edu"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university-phone">Phone Number</Label>
                      <Input
                        id="university-phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university-address">Address</Label>
                      <Input
                        id="university-address"
                        placeholder="123 University Ave"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="university-city">City</Label>
                        <Input
                          id="university-city"
                          placeholder="Boston"
                          value={formData.city}
                          onChange={(e) => updateFormData('city', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="university-country">Country</Label>
                        <Input
                          id="university-country"
                          placeholder="USA"
                          value={formData.country}
                          onChange={(e) => updateFormData('country', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="university-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password (min 6 characters)"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          required
                          disabled={isLoading}
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
                    <div className="space-y-2">
                      <Label htmlFor="university-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="university-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          disabled={isLoading}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword && <EyeSlash className="h-4 w-4" />}
                          {!showConfirmPassword && <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="university-terms" required disabled={isLoading} />
                      <label
                        htmlFor="university-terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Register University'
                      )}
                    </Button>
                  </form>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already registered?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recruiter Registration */}
            <TabsContent value="recruiter">
              <Card>
                <CardHeader>
                  <CardTitle>Recruiter Registration</CardTitle>
                  <CardDescription>Create your recruiter account and start hiring top talent</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => handleSubmit(e, 'recruiter')} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/30">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-3 rounded-md bg-success/10 text-success text-sm border border-success/30">
                        {success}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recruiter-firstname">First Name</Label>
                        <Input
                          id="recruiter-firstname"
                          placeholder="Alex"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recruiter-lastname">Last Name</Label>
                        <Input
                          id="recruiter-lastname"
                          placeholder="Johnson"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-email">Work Email</Label>
                      <Input
                        id="recruiter-email"
                        type="email"
                        placeholder="alex@company.com"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-company">Company Name</Label>
                      <Input
                        id="recruiter-company"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={(e) => updateFormData('company', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-title">Job Title</Label>
                      <Input
                        id="recruiter-title"
                        placeholder="HR Manager, Talent Acquisition, etc."
                        value={formData.jobTitle}
                        onChange={(e) => updateFormData('jobTitle', e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-phone">Phone Number</Label>
                      <Input
                        id="recruiter-phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="recruiter-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password (min 6 characters)"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          required
                          disabled={isLoading}
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
                    <div className="space-y-2">
                      <Label htmlFor="recruiter-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="recruiter-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                          disabled={isLoading}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword && <EyeSlash className="h-4 w-4" />}
                          {!showConfirmPassword && <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="recruiter-terms" required disabled={isLoading} />
                      <label
                        htmlFor="recruiter-terms"
                        className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Recruiter Account'
                      )}
                    </Button>
                  </form>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <span className="font-bold">Harbor</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Harbor. All rights reserved.</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
