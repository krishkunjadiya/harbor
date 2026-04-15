import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GraduationCap, 
  Medal, 
  TrendUp, 
  FileText,
  ShieldCheck,
  Users,
  ChartBar,
  ClipboardText,
  MagnifyingGlass,
  Briefcase,
  ChatCircleText,
  Bell,
  Lock,
  Globe,
  Database,
  Sparkle
} from "@phosphor-icons/react/dist/ssr"

export const dynamic = 'force-static'
export const revalidate = 3600

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col min-h-full">
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
                <Link href="/features" className="text-sm font-medium text-foreground">
                  Features
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </nav>
              <div className="flex items-center justify-self-end gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="container py-16 md:py-24 text-center">
            <div className="flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm w-fit mx-auto mb-6">
              <Sparkle className="h-4 w-4" />
              <span className="text-muted-foreground">Comprehensive Platform Features</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Everything You Need in One Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed to streamline education management, student development, and recruitment processes.
            </p>
          </section>

          {/* Feature Tabs by Role */}
          <section className="container py-8 md:py-16">
            <Tabs defaultValue="students" className="space-y-8">
              <TabsList className="mx-auto">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="universities">Universities</TabsTrigger>
                <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
              </TabsList>

              {/* Student Features */}
              <TabsContent value="students" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Student Features</h2>
                  <p className="text-muted-foreground">Build your professional profile and accelerate your career</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Medal className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Digital Credentials & Certificates</CardTitle>
                      <CardDescription>
                        Earn blockchain-verified credentials for skills, courses, and achievements. Showcase verifiable records to employers.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">AI Resume Analyzer</CardTitle>
                      <CardDescription>
                        Get instant feedback on your resume with AI-powered analysis. Receive personalized recommendations to improve your profile.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <TrendUp className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Career Insights</CardTitle>
                      <CardDescription>
                        Receive personalized career recommendations based on your skills, interests, and market trends.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ClipboardText className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Skill Portfolio</CardTitle>
                      <CardDescription>
                        Build a comprehensive portfolio showcasing your projects, certifications, and academic achievements.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Job Matching</CardTitle>
                      <CardDescription>
                        Get matched with relevant job opportunities based on your verified skills and academic performance.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Smart Notifications</CardTitle>
                      <CardDescription>
                        Stay updated with opportunities, credential updates, and important alerts tailored to your profile.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              {/* University Features */}
              <TabsContent value="universities" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">University Features</h2>
                  <p className="text-muted-foreground">Comprehensive tools for academic management and credential verification</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Blockchain Verification</CardTitle>
                      <CardDescription>
                        Issue tamper-proof, blockchain-verified certificates and academic records that can be instantly verified.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Student Management</CardTitle>
                      <CardDescription>
                        Centralized dashboard to manage student records, departments, faculty, and academic programs efficiently.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ChartBar className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                      <CardDescription>
                        Track student performance, placement rates, and institutional metrics with comprehensive analytics.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ClipboardText className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Academic Records</CardTitle>
                      <CardDescription>
                        Digitize and manage all academic records, transcripts, and credentials in one secure location.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Medal className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Credential Issuance</CardTitle>
                      <CardDescription>
                        Create and issue custom digital credentials for courses, skills, achievements, and extracurricular activities.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Capstone Management</CardTitle>
                      <CardDescription>
                        Manage final year projects, research papers, and capstone submissions with digital archiving.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              {/* Recruiter Features */}
              <TabsContent value="recruiters" className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Recruiter Features</h2>
                  <p className="text-muted-foreground">Streamline hiring with verified talent and powerful search tools</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <MagnifyingGlass className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Advanced Candidate Search</CardTitle>
                      <CardDescription>
                        Search and filter candidates by skills, education, location, and verified achievements with precision.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Verified Credentials</CardTitle>
                      <CardDescription>
                        Access blockchain-verified academic records and certificates to ensure authenticity.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Job Management</CardTitle>
                      <CardDescription>
                        Create, publish, and manage job postings. Track applications and candidate pipelines efficiently.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Talent Pool</CardTitle>
                      <CardDescription>
                        Build and maintain talent pools of qualified candidates for current and future opportunities.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ChartBar className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Hiring Analytics</CardTitle>
                      <CardDescription>
                        Track recruitment metrics, time-to-hire, and candidate quality with detailed analytics.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <ChatCircleText className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Direct Messaging</CardTitle>
                      <CardDescription>
                        Communicate directly with candidates, schedule interviews, and manage the hiring process seamlessly.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* Core Platform Features */}
          <section className="container py-16 md:py-24 bg-muted/50">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Platform Capabilities</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built on cutting-edge technology for security, scalability, and reliability
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Blockchain Security</CardTitle>
                  <CardDescription>
                    All credentials are secured on blockchain for immutable verification
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Data Privacy</CardTitle>
                  <CardDescription>
                    Enterprise-grade encryption and compliance with GDPR and data protection regulations
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Global Access</CardTitle>
                  <CardDescription>
                    Cloud-based platform accessible from anywhere, on any device, at any time
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI-Powered</CardTitle>
                  <CardDescription>
                    Advanced AI for resume analysis, job matching, and personalized career insights
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container py-16 md:py-24">
            <Card className="border-2">
              <CardContent className="flex flex-col items-center gap-4 p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Experience These Features?</h2>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Join Harbor today and unlock the full potential of our comprehensive platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button size="lg" asChild>
                    <Link href="/register">Get Started Free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/pricing">View Pricing</Link>
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
                    <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                    <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Company</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Legal</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                    <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p>© 2026 Harbor. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
    </div>
  )
}
