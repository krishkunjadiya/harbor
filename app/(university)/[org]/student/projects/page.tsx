"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy as TrophyIcon, MagnifyingGlass, Users, Calendar, CheckCircle, Clock, Eye, GitBranch, Code, Medal, GlobeHemisphereWest as Globe } from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect } from "react"
import { getUniversityStudentProjects } from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/header"
import { Briefcase as ProjectIcon } from "@phosphor-icons/react"


export default function StudentProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('No authenticated user found')
        setLoading(false)
        return
      }
      
      const projectsData = await getUniversityStudentProjects(user.id)
      
      // Transform database projects to component format
      const transformedProjects = projectsData.map((p: any) => ({
        id: p.id,
        title: p.title,
        studentName: p.student_name || 'Student',
        studentId: p.student_id,
        course: p.course_name || 'Independent Project',
        team: p.team_members || [],
        status: p.status || 'in-progress',
        grade: p.grade,
        startDate: p.start_date,
        endDate: p.end_date,
        tags: p.tags || [],
        description: p.description,
        technologies: p.technologies || [],
        githubUrl: p.github_url,
        demoUrl: p.demo_url
      }))
      
      setProjects(transformedProjects)
      setLoading(false)
    }
    fetchProjects()
  }, [])

  const normalizeUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return null
    const trimmed = String(rawUrl).trim()
    if (!trimmed) return null
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success"
      case "in-progress":
        return "bg-warning/10 text-warning"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const gradedProjects = projects.filter((p) => typeof p.grade === 'number' || (!Number.isNaN(Number(p.grade)) && p.grade !== null && p.grade !== undefined && p.grade !== ''))
  const averageGrade = gradedProjects.length > 0
    ? (gradedProjects.reduce((sum, p) => sum + Number(p.grade), 0) / gradedProjects.length).toFixed(1)
    : 'N/A'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <DashboardHeader title="Student Projects" icon={ProjectIcon} />
          <p className="text-muted-foreground">Browse and manage student capstone and course projects</p>
        </div>
        <Card>
          <CardContent className="space-y-4 py-8">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 pt-2">
              <Skeleton className="h-20 w-full" />
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
      <div className="space-y-1">
        <DashboardHeader title="Student Projects" icon={ProjectIcon} />
        <p className="text-muted-foreground">Browse and manage student capstone and course projects</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <TrophyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">All semesters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === "in-progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Grade</CardTitle>
            <Medal className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade}</div>
            <p className="text-xs text-muted-foreground">Graded projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by project title, student, or tags..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="all" className="rounded-lg">All ({projects.length})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({projects.filter(p => p.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({projects.filter(p => p.status === "in-progress").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Code className="h-7 w-7 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                            {project.grade && (
                              <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-bold">
                                Grade: {project.grade}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{project.course}</p>
                        </div>

                        <p className="text-sm">{project.description}</p>

                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-muted rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedProject(project)
                        setIsDetailsOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Team Members</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{project.team.join(", ")}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Duration</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{project.startDate} - {project.endDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Technologies Used</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech: string, index: number) => (
                          <span 
                            key={index} 
                            className="px-3 py-1 bg-info/10 text-info rounded-full text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          {normalizeUrl(project.githubUrl) ? (
                            <a
                              href={normalizeUrl(project.githubUrl)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-info hover:underline"
                            >
                              GitHub
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No GitHub URL</span>
                          )}
                        </div>
                        {project.demoUrl && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {normalizeUrl(project.demoUrl) ? (
                              <a
                                href={normalizeUrl(project.demoUrl)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-info hover:underline"
                              >
                                Live Demo
                              </a>
                            ) : (
                              <span className="text-muted-foreground">No demo URL</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        By {project.studentName} ({project.studentId})
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {filteredProjects
              .filter(p => p.status === "completed")
              .map((project) => (
                <Card key={project.id} className="border-success/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{project.title}</h3>
                            <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-bold">
                              {project.grade}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{project.course}</p>
                          <p className="text-sm mb-2">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech: string, index: number) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-muted rounded-md text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedProject(project)
                            setIsDetailsOpen(true)
                          }}
                        >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="space-y-4">
            {filteredProjects
              .filter(p => p.status === "in-progress")
              .map((project) => (
                <Card key={project.id} className="border-warning/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-warning" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1">{project.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{project.course}</p>
                        <p className="text-sm mb-2">{project.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.team.length} members
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due {project.endDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrophyIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No projects found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          </CardContent>
        </Card>
      )}

      {/* Project Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Project Categories</CardTitle>
          <CardDescription>Distribution by technology focus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {(() => {
              const categoryCounts: Record<string, number> = {}
              projects.forEach(p => {
                // Use first tag or technology as category, or 'General'
                const category = p.tags?.[0] || p.technologies?.[0] || 'General'
                categoryCounts[category] = (categoryCounts[category] || 0) + 1
              })

              const categories = Object.keys(categoryCounts)
                .map((cat, i) => ({
                  category: cat,
                  count: categoryCounts[cat],
                  color: ["bg-info", "bg-success", "bg-primary", "bg-warning", "bg-destructive"][i % 5]
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)

              if (categories.length === 0) {
                 return <p className="text-sm text-muted-foreground col-span-4 text-center">No categories available</p>
              }

              return categories.map((cat, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className={`h-10 w-10 rounded-lg ${cat.color} flex items-center justify-center mb-3`}>
                    <Code className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium mb-1">{cat.category}</p>
                  <p className="text-2xl font-bold">{cat.count}</p>
                  <p className="text-xs text-muted-foreground">projects</p>
                </div>
              ))
            })()}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.title || 'Project Details'}</DialogTitle>
            <DialogDescription>
              {selectedProject?.course || 'Course not specified'}
            </DialogDescription>
          </DialogHeader>

          {selectedProject ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedProject.studentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedProject.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="font-medium">{selectedProject.grade ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedProject.startDate || 'N/A'} - {selectedProject.endDate || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{selectedProject.description || 'No description available.'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(selectedProject.technologies || []).map((tech: string, idx: number) => (
                  <span key={`${tech}-${idx}`} className="px-2 py-1 bg-muted rounded text-xs">{tech}</span>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {normalizeUrl(selectedProject.githubUrl) && (
                  <Button asChild variant="outline">
                    <a href={normalizeUrl(selectedProject.githubUrl)!} target="_blank" rel="noopener noreferrer">Open GitHub</a>
                  </Button>
                )}
                {normalizeUrl(selectedProject.demoUrl) && (
                  <Button asChild>
                    <a href={normalizeUrl(selectedProject.demoUrl)!} target="_blank" rel="noopener noreferrer">Open Demo</a>
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
