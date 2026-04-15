'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookmarkSimple as BookmarkIcon, EnvelopeSimple as Envelope, Phone, GraduationCap, Briefcase, X as XIcon } from '@phosphor-icons/react'
import { unsaveCandidateForRecruiter } from '@/lib/actions/database'
import { formatDateUTC } from '@/lib/utils/date-format'

interface SavedCandidatesClientProps {
  candidates: any[]
  recruiterId: string
  org: string
}

export function SavedCandidatesClient({ candidates: initialCandidates, recruiterId, org }: SavedCandidatesClientProps) {
  const normalizeTextArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean)
    }

    if (typeof value === 'string') {
      return value
        .split(/[;,|]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  }

  const formatDate = (value?: string) => {
    return formatDateUTC(value)
  }

  // Transform data to match UI expectations
  const transformedCandidates = initialCandidates.map(c => {
    const student = c.student || {}
    // Access nested student data (handle array or object return style from Supabase)
    const academic = Array.isArray(student.students) ? student.students[0] : student.students || {}
    const projectRows = Array.isArray(student.student_projects) ? student.student_projects : []
    const credentialRows = Array.isArray(student.credentials) ? student.credentials : []
    
    return {
      id: c.id,
      originalId: c.student_id,
      name: student.full_name || 'Unknown Student',
      email: student.email || '',
      phone: student.phone || '',
      avatar_url: student.avatar_url,
      course: academic.major || 'Undeclared',
      university: academic.university || '',
      location: academic.location || '',
      bio: academic.bio || '',
      gpa: academic.gpa,
      graduationYear: academic.graduation_year,
      linkedin: academic.linkedin || academic.linkedin_url || '',
      github: academic.github || academic.github_url || '',
      portfolio: academic.portfolio || academic.portfolio_url || '',
      resumeUrl: academic.resume_url || '',
      skills: academic.skills || [],
      projects: projectRows.map((project: any) => ({
        id: project.id,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        status: project.status || 'in-progress',
        courseName: project.course_name || '',
        technologies: normalizeTextArray(project.technologies),
        tags: normalizeTextArray(project.tags),
        githubUrl: project.github_url || '',
        demoUrl: project.demo_url || '',
        startDate: project.start_date,
        endDate: project.end_date
      })),
      credentials: credentialRows.map((credential: any) => ({
        id: credential.id,
        title: credential.title || 'Credential',
        institution: credential.institution || 'Unknown Institution',
        type: credential.type || 'credential',
        issueDate: credential.issue_date,
        expiryDate: credential.expiry_date,
        credentialId: credential.credential_id,
        credentialUrl: credential.credential_url,
        verified: Boolean(credential.verified)
      })),
      savedAt: c.created_at,
      viewed: Boolean(c.viewed)
    }
  })

  const [candidates, setCandidates] = useState(transformedCandidates)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [removingCandidateId, setRemovingCandidateId] = useState<string | null>(null)

  const buildCandidateSearchText = (candidate: any) => {
    const skills = Array.isArray(candidate?.skills) ? candidate.skills.join(' ') : ''
    const projectInfo = Array.isArray(candidate?.projects)
      ? candidate.projects
          .flatMap((project: any) => [project?.title, project?.description, ...(Array.isArray(project?.technologies) ? project.technologies : [])])
          .filter(Boolean)
          .join(' ')
      : ''
    const credentialInfo = Array.isArray(candidate?.credentials)
      ? candidate.credentials
          .flatMap((credential: any) => [credential?.title, credential?.institution, credential?.type])
          .filter(Boolean)
          .join(' ')
      : ''

    return [
      candidate?.name,
      candidate?.email,
      candidate?.phone,
      candidate?.course,
      candidate?.university,
      candidate?.location,
      candidate?.bio,
      skills,
      projectInfo,
      credentialInfo,
      candidate?.graduationYear,
      candidate?.gpa,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  }

  const handleRemove = async (candidate: any) => {
    if (!candidate?.originalId) {
      toast.error('Unable to identify candidate to remove.')
      return
    }

    setRemovingCandidateId(candidate.id)
    const result = await unsaveCandidateForRecruiter(candidate.originalId)

    if (!result.success) {
      toast.error(result.message || 'Failed to remove candidate.')
      setRemovingCandidateId(null)
      return
    }

    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
    toast.success('Candidate removed from shortlist.')
    setRemovingCandidateId(null)
  }

  const filteredCandidates = candidates.filter(c => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    const tokens = normalizedSearch.split(/\s+/).filter(Boolean)
    const searchableText = buildCandidateSearchText(c)
    const matchedTokens = tokens.filter((token) => searchableText.includes(token)).length
    const minMatchedTokens = Math.max(1, Math.ceil(tokens.length * 0.6))
    const matchesSearch = tokens.length === 0 || matchedTokens >= minMatchedTokens

    if (courseFilter === 'all') return matchesSearch
    return matchesSearch && c.course === courseFilter
  })

  const uniqueCourses = ['all', ...Array.from(new Set(candidates.map(c => c.course))).filter(Boolean)] as string[]

  const stats = {
    total: candidates.length,
    courses: new Set(candidates.map(c => c.course)).size,
    viewed: candidates.filter(c => c.viewed).length
  }

  const getInitials = (name?: string) => {
    if (!name) return 'SC'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const openCandidateDetails = (candidate: any) => {
    setSelectedCandidate(candidate)
    setIsDetailDialogOpen(true)
  }

  const handleContactCandidate = (candidate: any) => {
    if (candidate?.email) {
      window.location.href = `mailto:${candidate.email}`
      return
    }
    if (candidate?.phone) {
      window.location.href = `tel:${candidate.phone}`
      return
    }
    alert('No contact details available for this candidate.')
  }

  const getInterviewHref = (candidate: any) => {
    const params = new URLSearchParams({
      candidateId: candidate.originalId,
      candidateName: candidate.name || '',
      position: candidate.course || 'Candidate Interview',
    })

    return `/${org}/interviews?${params.toString()}`
  }

  const getFullProfileHref = (candidate: any) => {
    return `/${org}/candidates/${candidate.originalId}`
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shortlisted</CardTitle>
            <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Majors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by skills, major, university, projects, credentials, or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Major" />
          </SelectTrigger>
          <SelectContent>
            {uniqueCourses.map(course => (
              <SelectItem key={course} value={course}>
                {course === 'all' ? 'All Majors' : course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookmarkIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shortlisted Candidates</h3>
            <p className="text-sm text-muted-foreground">Shortlist candidates from search or profile views</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} />
                      <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-base">{candidate.name}</CardTitle>
                      <CardDescription className="text-xs">{candidate.course}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(candidate)}
                    disabled={removingCandidateId === candidate.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Envelope className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{candidate.email}</span>
                </div>

                {candidate.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.phone}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills?.slice(0, 3).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{candidate.skills.length - 3}
                      </Badge>
                    )}
                    {(!candidate.skills || candidate.skills.length === 0) && (
                      <span className="text-xs text-muted-foreground">No skills listed</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GPA</span>
                    <span className="font-medium">{candidate.gpa || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border bg-muted/30 px-2 py-1 text-center">
                      <p className="text-muted-foreground">Certifications</p>
                      <p className="font-medium text-foreground">{candidate.certifications?.length || 0}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-2 py-1 text-center">
                      <p className="text-muted-foreground">Projects</p>
                      <p className="font-medium text-foreground">{candidate.projects?.length || 0}</p>
                    </div>
                    <div className="rounded-md border bg-muted/30 px-2 py-1 text-center">
                      <p className="text-muted-foreground">Credentials</p>
                      <p className="font-medium text-foreground">{candidate.credentials?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Saved</span>
                    <span className="font-medium">{formatDate(candidate.savedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openCandidateDetails(candidate)}
                  >
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleContactCandidate(candidate)}>
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCandidate?.name}</DialogTitle>
            <DialogDescription>{selectedCandidate?.course}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedCandidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate?.name}`} />
                <AvatarFallback>{getInitials(selectedCandidate?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Contact</p>
                <div className="space-y-1">
                  <p className="text-sm flex items-center gap-2">
                    <Envelope className="h-4 w-4" />
                    {selectedCandidate?.email}
                  </p>
                  {selectedCandidate?.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedCandidate?.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Major</p>
                <p className="font-medium">{selectedCandidate?.course || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GPA</p>
                <p className="font-medium">{selectedCandidate?.gpa || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Graduation Year</p>
                <p className="font-medium">{selectedCandidate?.graduationYear || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">University</p>
                <p className="font-medium">{selectedCandidate?.university || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{selectedCandidate?.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saved On</p>
                <p className="font-medium">{formatDate(selectedCandidate?.savedAt)}</p>
              </div>
            </div>

            {selectedCandidate?.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">About</p>
                <p className="text-sm">{selectedCandidate.bio}</p>
              </div>
            )}

            {selectedCandidate?.skills && selectedCandidate.skills.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {(selectedCandidate?.linkedin || selectedCandidate?.github || selectedCandidate?.portfolio || selectedCandidate?.resumeUrl) && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Profile Links</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate?.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCandidate.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </Button>
                  )}
                  {selectedCandidate?.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCandidate.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                    </Button>
                  )}
                  {selectedCandidate?.portfolio && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCandidate.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a>
                    </Button>
                  )}
                  {selectedCandidate?.resumeUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">Resume</a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Projects</p>
              {selectedCandidate?.projects && selectedCandidate.projects.length > 0 ? (
                <div className="space-y-3">
                  {selectedCandidate.projects.map((project: any) => (
                    <div key={project.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{project.title}</p>
                          {project.courseName && <p className="text-xs text-muted-foreground">{project.courseName}</p>}
                        </div>
                        <Badge variant="outline" className="capitalize">{project.status}</Badge>
                      </div>

                      {project.description && (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}

                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((technology: string, index: number) => (
                            <Badge key={`${project.id}-tech-${index}`} variant="secondary" className="text-xs">
                              {technology}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {(project.githubUrl || project.demoUrl) && (
                        <div className="flex gap-2">
                          {project.githubUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
                            </Button>
                          )}
                          {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">Demo</a>
                            </Button>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {project.startDate ? formatDate(project.startDate) : 'N/A'} - {project.endDate ? formatDate(project.endDate) : 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects listed</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Credentials</p>
              {selectedCandidate?.credentials && selectedCandidate.credentials.length > 0 ? (
                <div className="space-y-2">
                  {selectedCandidate.credentials.map((credential: any) => (
                    <div key={credential.id} className="border rounded-md p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{credential.title}</p>
                          <p className="text-xs text-muted-foreground">{credential.institution}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">{credential.type}</Badge>
                          {credential.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>Issued: {formatDate(credential.issueDate)}</p>
                        {credential.expiryDate && <p>Expires: {formatDate(credential.expiryDate)}</p>}
                        {credential.credentialId && <p>Credential ID: {credential.credentialId}</p>}
                      </div>

                      {credential.credentialUrl && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={credential.credentialUrl} target="_blank" rel="noopener noreferrer">View Credential</a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No credentials listed</p>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {selectedCandidate ? (
                <Button className="flex-1" asChild>
                  <Link
                    href={getInterviewHref(selectedCandidate)}
                    prefetch={true}
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Schedule Interview
                  </Link>
                </Button>
              ) : (
                <Button className="flex-1" disabled>
                  Schedule Interview
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => selectedCandidate && handleContactCandidate(selectedCandidate)}
                disabled={!selectedCandidate}
              >
                Contact
              </Button>
              {selectedCandidate ? (
                <Button variant="outline" className="flex-1" asChild>
                  <Link
                    href={getFullProfileHref(selectedCandidate)}
                    prefetch={true}
                    onClick={() => setIsDetailDialogOpen(false)}
                  >
                    Full Profile
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" disabled>
                  Full Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
