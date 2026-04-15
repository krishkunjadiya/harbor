"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendUp,
  Briefcase,
  Sparkle,
  Crosshair as TargetIcon,
  TrendDown as TrendingDownIcon,
  CurrencyDollar as DollarSignIcon,
  MapPin,
  Buildings,
  ArrowRight,
  BookOpen,
  CheckCircle,
} from "@phosphor-icons/react"
import { DashboardHeader } from "@/components/header"
import { createClient } from "@/lib/supabase/client"

type JobRecord = {
  id: string
  title: string
  company: string | null
  location: string | null
  description: string | null
  job_type: string | null
  salary_min: number | null
  salary_max: number | null
  skills_required: string[] | null
}

type CareerData = {
  readiness: number
  skillsMatch: number
  experienceLevel: number
  profileComplete: number
  jobs: Array<JobRecord & { match: number; matchedSkills: string[] }>
  trendingSkills: Array<{ name: string; change: string }>
  decliningSkills: Array<{ name: string; change: string }>
  marketDemand: "Low" | "Medium" | "High"
  salaryAverage: number
  salaryMin: number
  salaryMax: number
  topMissingSkills: Array<{ name: string; priority: "High" | "Medium"; time: string }>
}

const defaultData: CareerData = {
  readiness: 0,
  skillsMatch: 0,
  experienceLevel: 0,
  profileComplete: 0,
  jobs: [],
  trendingSkills: [],
  decliningSkills: [],
  marketDemand: "Low",
  salaryAverage: 0,
  salaryMin: 0,
  salaryMax: 0,
  topMissingSkills: [],
}

function normalizeSkill(raw: string): string {
  return raw.trim().toLowerCase()
}

function titleSkill(raw: string): string {
  return raw
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}

export default function CareerInsightsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CareerData>(defaultData)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const supabase = createClient()

      try {
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id
        if (!userId || cancelled) {
          setLoading(false)
          return
        }

        const [studentRes, taxonomySkillsRes, applicationsRes, jobsRes] = await Promise.all([
          supabase
            .from("students")
            .select("major, gpa, graduation_year, resume_score, bio, github_url, linkedin_url, portfolio_url")
            .eq("profile_id", userId)
            .single(),
          supabase
            .from("student_taxonomy_skills")
            .select("proficiency_level, skills_taxonomy(title)")
            .eq("student_id", userId),
          supabase
            .from("job_applications")
            .select("id")
            .eq("student_id", userId),
          supabase
            .from("jobs")
            .select("id, title, company, location, description, job_type, salary_min, salary_max, skills_required")
            .eq("status", "active")
            .limit(60),
        ])

        const student = (studentRes.data || {}) as {
          major?: string | null
          gpa?: number | null
          graduation_year?: string | null
          resume_score?: number | null
          bio?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
        }
        const applicationsCount = (applicationsRes.data || []).length
        const jobs = (jobsRes.data || []) as JobRecord[]

        const userSkills = new Set<string>()
        const proficiencyValues: number[] = []
        for (const item of taxonomySkillsRes.data || []) {
          const title = (item as any)?.skills_taxonomy?.title
          if (title) userSkills.add(normalizeSkill(title))
          const prof = Number((item as any)?.proficiency_level)
          if (Number.isFinite(prof)) proficiencyValues.push(prof)
        }

        const profileFields = [student.bio, student.github_url, student.linkedin_url, student.portfolio_url, student.major]
        const profileComplete = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

        const experienceLevel = Math.min(100, Math.round(applicationsCount * 12 + (Number(student.gpa) || 0) * 10))

        const scoredJobs = jobs
          .map((job) => {
            const required = (job.skills_required || []).map(normalizeSkill)
            if (required.length === 0) {
              return { ...job, match: userSkills.size > 0 ? 60 : 40, matchedSkills: [] }
            }
            const matched = required.filter((skill) => userSkills.has(skill))
            const match = Math.round((matched.length / required.length) * 100)
            return { ...job, match, matchedSkills: matched }
          })
          .sort((a, b) => b.match - a.match)

        const recommendedJobs = scoredJobs.slice(0, 3)
        const skillsMatch = recommendedJobs.length > 0
          ? Math.round(recommendedJobs.reduce((sum, j) => sum + j.match, 0) / recommendedJobs.length)
          : 0

        const avgProficiency = proficiencyValues.length > 0
          ? Math.round(proficiencyValues.reduce((sum, p) => sum + p, 0) / proficiencyValues.length)
          : 0

        const readiness = Math.round((skillsMatch * 0.45) + (experienceLevel * 0.2) + (profileComplete * 0.2) + (avgProficiency * 0.15))

        const marketSkillCounts = new Map<string, number>()
        for (const job of jobs) {
          for (const skill of job.skills_required || []) {
            const normalized = normalizeSkill(skill)
            marketSkillCounts.set(normalized, (marketSkillCounts.get(normalized) || 0) + 1)
          }
        }

        const trendingSkills = Array.from(marketSkillCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count], index) => ({
            name: titleSkill(name),
            change: `+${Math.max(8, Math.round((count / Math.max(1, jobs.length)) * 100) + (5 - index) * 2)}%`,
          }))

        const decliningSkills = Array.from(userSkills)
          .map((skill) => ({ skill, count: marketSkillCounts.get(skill) || 0 }))
          .sort((a, b) => a.count - b.count)
          .slice(0, 5)
          .map((item, index) => ({
            name: titleSkill(item.skill),
            change: `-${Math.max(4, 18 - index * 3)}%`,
          }))

        const allSalaryMins = jobs.map((j) => Number(j.salary_min)).filter((n) => Number.isFinite(n) && n > 0)
        const allSalaryMaxs = jobs.map((j) => Number(j.salary_max)).filter((n) => Number.isFinite(n) && n > 0)
        const salaryMin = allSalaryMins.length > 0 ? Math.min(...allSalaryMins) : 0
        const salaryMax = allSalaryMaxs.length > 0 ? Math.max(...allSalaryMaxs) : 0
        const salaryAverage = salaryMin && salaryMax ? Math.round((salaryMin + salaryMax) / 2) : 0

        const jobSkillNeeds = new Map<string, number>()
        for (const job of recommendedJobs) {
          for (const skill of job.skills_required || []) {
            const normalized = normalizeSkill(skill)
            if (!userSkills.has(normalized)) {
              jobSkillNeeds.set(normalized, (jobSkillNeeds.get(normalized) || 0) + 1)
            }
          }
        }

        const topMissingSkills = Array.from(jobSkillNeeds.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({
            name: titleSkill(name),
            priority: count >= 2 ? "High" as const : "Medium" as const,
            time: count >= 2 ? "1-2 months" : "2-4 weeks",
          }))

        const marketDemand: CareerData["marketDemand"] = recommendedJobs.length >= 3 && skillsMatch >= 60
          ? "High"
          : recommendedJobs.length >= 2
            ? "Medium"
            : "Low"

        if (!cancelled) {
          setData({
            readiness,
            skillsMatch,
            experienceLevel,
            profileComplete,
            jobs: recommendedJobs,
            trendingSkills,
            decliningSkills,
            marketDemand,
            salaryAverage,
            salaryMin,
            salaryMax,
            topMissingSkills,
          })
        }
      } catch (error) {
        console.error("Failed to load career insights:", error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const pathCards = useMemo(() => {
    const titles = data.jobs.map((job) => job.title.toLowerCase())
    const hasFrontend = titles.some((t) => t.includes("frontend") || t.includes("react") || t.includes("ui"))
    const hasFullStack = titles.some((t) => t.includes("full") || t.includes("backend") || t.includes("node"))
    const hasData = titles.some((t) => t.includes("data") || t.includes("analyst") || t.includes("ai"))

    const cards = []
    if (hasFrontend || cards.length === 0) {
      cards.push({
        title: "Frontend Specialist",
        description: "Leverage your strongest UI and product delivery strengths",
        bestMatch: true,
      })
    }
    if (hasFullStack || cards.length < 2) {
      cards.push({
        title: "Full Stack Developer",
        description: "Expand into API design, backend systems, and architecture",
        bestMatch: false,
      })
    }
    if (hasData || cards.length < 3) {
      cards.push({
        title: "Data/Product Engineer",
        description: "Blend engineering with analytics and decision systems",
        bestMatch: false,
      })
    }

    return cards.slice(0, 3)
  }, [data.jobs])

  const readinessScore = Math.max(0, Math.min(100, Number(data.readiness) || 0))
  const readinessCircumference = 2 * Math.PI * 54
  const readinessOffset = readinessCircumference * (1 - readinessScore / 100)
  const readinessStroke =
    readinessScore >= 80 ? "var(--success)" : readinessScore >= 60 ? "var(--warning)" : "var(--destructive)"

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <DashboardHeader title="Career Insights" icon={Sparkle} />
          <p className="text-muted-foreground">AI-powered career recommendations and market insights</p>
        </div>
        <Card>
          <CardContent className="space-y-4 py-8">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid gap-3 md:grid-cols-3 pt-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <DashboardHeader title="Career Insights" icon={Sparkle} />
        <p className="text-muted-foreground">AI-powered career recommendations and market insights</p>
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" />
            Career Readiness Score
          </CardTitle>
          <CardDescription>Your overall preparedness for the job market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" aria-label="Career readiness progress">
                <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted/30" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={readinessCircumference}
                  strokeDashoffset={readinessOffset}
                  style={{ stroke: readinessStroke, transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-4xl font-bold ${
                  readinessScore >= 80 ? "text-success" : readinessScore >= 60 ? "text-warning" : "text-destructive"
                }`}>{readinessScore}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center text-success">
                    <TargetIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Skills Match</span>
                </div>
                <span className="font-bold text-lg">{data.skillsMatch}%</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-info/15 flex items-center justify-center text-info">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Experience Level</span>
                </div>
                <span className="font-bold text-lg">{data.experienceLevel}%</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Profile Complete</span>
                </div>
                <span className="font-bold text-lg">{data.profileComplete}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Job Opportunities</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="paths">Career Paths</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended Jobs</CardTitle>
                  <CardDescription>
                    {data.jobs.length > 0 ? `${data.jobs.length} positions matching your profile` : "No personalized matches yet"}
                  </CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/student/jobs" prefetch={false}>View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.jobs.length > 0 ? (
                data.jobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Buildings className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company || "Company"}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.match >= 80 ? "bg-success/15 text-success" : job.match >= 60 ? "bg-info/15 text-info" : "bg-warning/20 text-warning"}`}>
                        {job.match}% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location || "Location not specified"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSignIcon className="h-4 w-4" />
                        {job.salary_min || job.salary_max
                          ? `$${job.salary_min || 0} - $${job.salary_max || 0}`
                          : "Salary not disclosed"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.job_type || "Role"}
                      </span>
                    </div>
                    <p className="text-sm mb-3 line-clamp-2">{job.description || "No description available."}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(job.skills_required || []).slice(0, 5).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-muted rounded text-xs">{skill}</span>
                      ))}
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/student/jobs/${job.id}`} prefetch={false}>
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active jobs available for recommendation right now.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.salaryAverage > 0 ? `$${data.salaryAverage.toLocaleString()}` : "N/A"}</div>
                <p className="text-xs text-muted-foreground">From active market roles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salary Range</CardTitle>
                <TrendUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.salaryMin > 0 || data.salaryMax > 0
                    ? `$${data.salaryMin.toLocaleString()} - $${data.salaryMax.toLocaleString()}`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Across recommended openings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Demand</CardTitle>
                <TrendUp className={`h-4 w-4 ${data.marketDemand === "High" ? "text-success" : data.marketDemand === "Medium" ? "text-warning" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.marketDemand}</div>
                <p className="text-xs text-muted-foreground">Based on skill-job overlap</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-success" />
                  Trending Skills
                </CardTitle>
                <CardDescription>In-demand skills from active jobs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.trendingSkills.length > 0 ? data.trendingSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendUp className="h-4 w-4 text-success" />
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <span className="text-sm text-success font-medium">{skill.change}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Not enough market data yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDownIcon className="h-5 w-5 text-warning" />
                  Low-Market Skills
                </CardTitle>
                <CardDescription>Your skills with currently lower demand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.decliningSkills.length > 0 ? data.decliningSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDownIcon className="h-4 w-4 text-warning" />
                      <span className="font-medium text-muted-foreground">{skill.name}</span>
                    </div>
                    <span className="text-sm text-warning font-medium">{skill.change}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No low-demand signals found.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Career Paths</CardTitle>
              <CardDescription>Based on your skill-to-market fit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pathCards.map((path) => (
                <div key={path.title} className={`p-4 rounded-lg ${path.bestMatch ? "border-2 border-primary" : "border"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{path.title}</h3>
                      <p className="text-sm text-muted-foreground">{path.description}</p>
                    </div>
                    {path.bestMatch ? (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Best Match</span>
                    ) : null}
                  </div>
                  <Button
                    variant={path.bestMatch ? "default" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link href="/student/learning-resources" prefetch={false}>Explore This Path</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Gap Analysis</CardTitle>
              <CardDescription>Highest-impact skills to improve your match rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topMissingSkills.length > 0 ? (
                data.topMissingSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{skill.name}</p>
                      <p className="text-xs text-muted-foreground">Est. learning time: {skill.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${skill.priority === "High" ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-warning"}`}>
                        {skill.priority}
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/student/learning-resources" prefetch={false}>Learn</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No skills gap detected yet. Keep your profile and skills updated.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Learning Resources</CardTitle>
              <CardDescription>Focused on your highest-priority skill gaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.topMissingSkills.slice(0, 4).length > 0 ? data.topMissingSkills.slice(0, 4) : [
                { name: "TypeScript", priority: "High", time: "1-2 months" },
                { name: "API Design", priority: "Medium", time: "2-4 weeks" },
                { name: "Testing", priority: "Medium", time: "2-4 weeks" },
                { name: "Docker", priority: "Medium", time: "2-4 weeks" },
              ]).map((skill) => (
                <div key={skill.name} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Master {skill.name}</p>
                      <p className="text-xs text-muted-foreground">Priority: {skill.priority} • Duration: {skill.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/student/learning-resources" prefetch={false}>View Course</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
