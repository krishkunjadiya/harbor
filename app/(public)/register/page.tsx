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
    userType: "university",
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
  const [activeTab, setActiveTab] = useState("university")
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

    if (userType === 'student') {
      setError('Student self-registration is disabled. Please contact your university administrator to get a student account.')
      return
    }

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

          <Tabs defaultValue="university" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="university">University</TabsTrigger>
              <TabsTrigger value="recruiter">Recruiter</TabsTrigger>
            </TabsList>

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
