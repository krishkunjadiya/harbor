'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Briefcase,
  MagnifyingGlass,
  Users,
  Calendar,
  CheckCircle as CheckCircle2Icon,
  Clock,
  WarningCircle,
  CaretRight,
  FunnelSimple as Funnel,
  DotsThreeVertical,
  FileText,
  Medal,
  Plus as PlusIcon } from "@phosphor-icons/react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { 
  createCapstoneProject, 
  updateCapstoneMilestone, 
  gradeCapstoneProject 
} from "@/lib/actions/database"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


interface Milestone {
  proposal: string
  midterm: string
  final: string
}

interface Capstone {
  id: string
  title: string
  course: string
  team: string[]
  studentIds: string[]
  mentor: string
  status: string
  progress: number
  startDate: string
  dueDate: string
  presentation?: string
  tags: string[]
  score?: number
  milestones: Milestone
}

interface CapstoneClientProps {
  initialCapstones: Capstone[]
}

export function CapstoneClient({ initialCapstones }: CapstoneClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [capstones, setCapstones] = useState<Capstone[]>(initialCapstones)
  const [filter, setFilter] = useState('all')
  
  // Dialog States
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Capstone | null>(null)
  
  // Form States
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    course_name: '',
    team_members: '',
    start_date: '',
    end_date: ''
  })
  const [gradeData, setGradeData] = useState({ grade: 0, feedback: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCapstones = capstones.filter(capstone => {
    const matchesSearch = 
      capstone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capstone.team.some(member => member.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (filter === 'all') return matchesSearch
    return matchesSearch && capstone.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/15 text-success border-success/30'
      case 'in-progress':
        return 'bg-info/15 text-info border-info/30'
      case 'submitted':
        return 'bg-primary/15 text-primary border-primary/30'
      case 'on-hold':
        return 'bg-warning/20 text-warning border-warning/35'
      default:
        return 'bg-muted text-muted-foreground border-gray-200'
    }
  }

  const handleAssignProject = async () => {
    if (!newProject.title || !newProject.course_name) {
      toast.error("Please fill in the required fields")
      return
    }

    setIsSubmitting(true)
    try {
      // Fetch faculty profile for mentor name
      const result = await createCapstoneProject({
        ...newProject,
        team_members: newProject.team_members.split(',').map(s => s.trim()),
        status: 'in-progress',
        progress: 0,
        created_at: new Date().toISOString()
      })

      if (result) {
        toast.success("Project assigned successfully")
        setIsAssignDialogOpen(false)
        router.refresh()
      }
    } catch (err) {
      toast.error("Failed to assign project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateMilestone = async (projectId: string, milestone: string, status: string) => {
    try {
      const result = await updateCapstoneMilestone(projectId, milestone, status)
      if (result) {
        toast.success(`Milestone ${milestone} updated to ${status}`)
        router.refresh()
      }
    } catch (err) {
      toast.error("Failed to update milestone")
    }
  }

  const handleGradeProject = async () => {
    if (!selectedProject) return
    
    setIsSubmitting(true)
    try {
      const result = await gradeCapstoneProject(selectedProject.id, gradeData.grade.toString(), gradeData.feedback)
      if (result) {
        toast.success("Project graded successfully")
        setIsGradeDialogOpen(false)
        router.refresh()
      }
    } catch (err) {
      toast.error("Failed to grade project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = {
    total: capstones.length,
    active: capstones.filter(c => c.status === 'in-progress').length,
    submitted: capstones.filter(c => c.status === 'submitted').length,
    completed: capstones.filter(c => c.status === 'completed').length }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <DashboardHeader title="Capstone Projects" icon={FacultyIcon} />
          <p className="text-muted-foreground">Manage and track student graduation projects</p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Assign Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-x-2">Assign New Capstone Project</DialogTitle>
              <DialogDescription>Create a new project and assign it to a student team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Title *</Label>
                <Input 
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  placeholder="e.g. AI-Powered Health Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label>Course Name *</Label>
                <Input 
                  value={newProject.course_name}
                  onChange={(e) => setNewProject({...newProject, course_name: e.target.value})}
                  placeholder="e.g. Advanced Software Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label>Team Members (comma separated names)</Label>
                <Input 
                  value={newProject.team_members}
                  onChange={(e) => setNewProject({...newProject, team_members: e.target.value})}
                  placeholder="e.g. John Doe, Jane Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignProject} disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Assign Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-info">{stats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-info/15 flex items-center justify-center">
                <Clock className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-primary">{stats.submitted}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2Icon className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects or students..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
                <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
                  <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                  <TabsTrigger value="in-progress" className="rounded-lg">In Progress</TabsTrigger>
                  <TabsTrigger value="submitted" className="rounded-lg">Submitted</TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="icon">
                <Funnel className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredCapstones.length > 0 ? (
          filteredCapstones.map((project) => (
            <Card key={project.id} className="group hover:border-primary transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{project.course}</span>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <DotsThreeVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Update Milestone</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleUpdateMilestone(project.id, 'proposal', 'approved')}>
                        Approve Proposal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateMilestone(project.id, 'midterm', 'approved')}>
                        Approve Midterm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateMilestone(project.id, 'final', 'submitted')}>
                        Mark Final Submitted
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-primary"
                        onClick={() => {
                          setSelectedProject(project)
                          setIsGradeDialogOpen(true)
                        }}
                      >
                        <Medal className="h-4 w-4" /> Grade Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Overall Progress</span>
                    <span className="font-bold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Team
                    </p>
                    <p className="text-sm font-medium truncate">
                      {project.team.join(", ") || 'No team members'}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3" /> Due Date
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(project.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-wrap gap-2">
                  {Object.entries(project.milestones).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="gap-1.5 font-normal capitalize">
                      {value === 'approved' || value === 'completed' ? (
                        <CheckCircle2Icon className="h-3 w-3 text-success" />
                      ) : value === 'submitted' ? (
                        <WarningCircle className="h-3 w-3 text-info" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                      {key}
                    </Badge>
                  ))}
                </div>

                <Button variant="ghost" className="w-full mt-2 group-hover:bg-accent">
                  <div className="flex items-center justify-center gap-2">
                    Open Project Workspace
                    <CaretRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {searchQuery || filter !== 'all' 
                  ? "We couldn't find any projects matching your current filters."
                  : "You haven't been assigned any capstone projects yet."}
              </p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-x-2">Grade Project: {selectedProject?.title}</DialogTitle>
            <DialogDescription>Assign a final grade and feedback for this capstone project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Final Score (0-100)</Label>
              <Input 
                type="number"
                value={gradeData.grade}
                onChange={(e) => setGradeData({...gradeData, grade: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Faculty Feedback</Label>
              <Textarea 
                value={gradeData.feedback}
                onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                placeholder="Provide constructive feedback for the student team..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGradeProject} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
