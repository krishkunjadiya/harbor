"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  GraduationCap, 
  Buildings, 
  Briefcase, 
  Medal, 
  TrendUp, 
  Users, 
  ShieldCheck, 
  Lightning 
} from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()
  
  const handleGetStarted = () => {
    router.push('/register')
  }
  
  const handleLogin = () => {
    router.push('/login')
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/landing" className="flex items-center gap-2 cursor-pointer">
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">Harbor</span>
          </Link>
          <nav className="hidden md:flex items-center justify-self-center gap-6">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Pricing
            </Link>
            <Link href="/landing#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              About
            </Link>
          </nav>
          <div className="flex items-center justify-self-end gap-2">
            <Button variant="ghost" onClick={handleLogin}>
              Login
            </Button>
            <Button onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-4 py-16 md:py-24 text-center">
        <div className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
          <Lightning className="h-4 w-4" />
          <span className="text-muted-foreground">Empowering Student Success</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
          Bridge the Gap Between Education and Employment
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Harbor connects students, universities, and recruiters in one comprehensive platform. 
          Build skills, showcase achievements, and discover opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button size="lg" onClick={handleGetStarted}>
            Start Your Journey
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/features">Explore Features</Link>
          </Button>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="container py-16 md:py-24 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We Serve</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A unified platform designed for students, universities, and recruiters
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>For Students</CardTitle>
              <CardDescription>
                Build your professional profile, showcase verified credentials, and get AI-powered career insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <Medal className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Showcase certifications and achievements</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">AI resume analysis and career guidance</span>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Direct connection to recruiters</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Buildings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>For Universities</CardTitle>
              <CardDescription>
                Manage student records, issue verified credentials, and track academic outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Issue blockchain-verified certificates</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Comprehensive student management</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Analytics and performance tracking</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>For Recruiters</CardTitle>
              <CardDescription>
                Discover verified talent, access verified credentials, and streamline hiring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Access verified academic records</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Advanced candidate search and filtering</span>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">Manage job postings and applications</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-4 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
            <p className="text-muted-foreground">Active Students</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
            <p className="text-muted-foreground">Partner Universities</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
            <p className="text-muted-foreground">Hiring Companies</p>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
            <p className="text-muted-foreground">Placement Rate</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24 bg-muted/50">
        <Card className="border-2">
          <CardContent className="flex flex-col items-center gap-4 p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Join thousands of students, universities, and recruiters already using Harbor to transform education and employment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button size="lg" onClick={handleGetStarted}>
                Create Account
              </Button>
              <Button size="lg" variant="outline" onClick={handleLogin}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 mt-auto">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5" />
                <span className="font-bold">Harbor</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Bridging education and employment through technology.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors cursor-pointer">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors cursor-pointer">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors cursor-pointer">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 Harbor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
