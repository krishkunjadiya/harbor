"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase,
  MapPin,
  CurrencyDollar as DollarSignIcon,
  Calendar,
  Users,
  Plus as PlusIcon,
  X as XIcon,
  FloppyDisk,
  PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCommonSkills } from "@/lib/actions/database"
import { createJob } from "@/lib/actions/mutations"
import { SpinnerGap as Loader2Icon } from "@phosphor-icons/react/dist/ssr"
import { JobType } from "@/lib/types/database"

const parseSalaryValue = (rawValue: string): number | null | 'invalid' => {
  const normalized = rawValue.replace(/,/g, '').trim()
  if (!normalized) return null
  if (!/^\d+$/.test(normalized)) return 'invalid'

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : 'invalid'
}

export default function CreateJobPage() {
  const router = useRouter()
  const params = useParams()
  const org = params?.org as string
  const [jobTitle, setJobTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")
  const [jobType, setJobType] = useState<JobType>("full-time")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [description, setDescription] = useState("")
  const [responsibilities, setResponsibilities] = useState([""])
  const [requirements, setRequirements] = useState([""])
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch available skills from database
  useEffect(() => {
    async function fetchOptions() {
      try {
        const skillsData = await getCommonSkills()

        setAvailableSkills(skillsData.map((s: any) => s.skill_name))
      } catch (error) {
        console.error('Failed to load create job options:', error)
        setAvailableSkills([])
      }
    }
    fetchOptions()
  }, [])

  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, ""])
  }

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index))
  }

  const handleResponsibilityChange = (index: number, value: string) => {
    const updated = [...responsibilities]
    updated[index] = value
    setResponsibilities(updated)
  }

  const handleAddRequirement = () => {
    setRequirements([...requirements, ""])
  }

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const handleRequirementChange = (index: number, value: string) => {
    const updated = [...requirements]
    updated[index] = value
    setRequirements(updated)
  }

  const handleToggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill))
    } else {
      setSkills([...skills, skill])
    }
  }

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const handleSubmit = async (status: 'active' | 'draft') => {
    const trimmedTitle = jobTitle.trim()
    const trimmedDescription = description.trim()
    const trimmedDepartment = department.trim()
    const trimmedLocation = location.trim()

    if (!trimmedTitle || !trimmedDescription) {
      alert("Please fill in the required fields (Job Title and Description).")
      return
    }

    if (!trimmedDepartment || !trimmedLocation) {
      alert("Please fill in Department and Location.")
      return
    }

    const parsedSalaryMin = parseSalaryValue(salaryMin)
    const parsedSalaryMax = parseSalaryValue(salaryMax)

    if (parsedSalaryMin === 'invalid' || parsedSalaryMax === 'invalid') {
      alert("Salary values must be whole numbers.")
      return
    }

    if (
      typeof parsedSalaryMin === 'number' &&
      typeof parsedSalaryMax === 'number' &&
      parsedSalaryMin > parsedSalaryMax
    ) {
      alert("Minimum salary cannot be greater than maximum salary.")
      return
    }

    setIsSubmitting(true)
    try {
      const cleanResponsibilities = responsibilities.filter(r => r.trim())
      const cleanRequirements = requirements.filter(r => r.trim())

      const descriptionSections = [trimmedDescription]
      if (trimmedDepartment) {
        descriptionSections.push(`Department: ${trimmedDepartment}`)
      }
      if (cleanResponsibilities.length > 0) {
        descriptionSections.push(`Responsibilities:\n${cleanResponsibilities.join("\n")}`)
      }

      const jobData = {
        title: trimmedTitle,
        description: descriptionSections.join("\n\n"),
        location: trimmedLocation,
        job_type: jobType,
        salary_min: parsedSalaryMin,
        salary_max: parsedSalaryMax,
        experience_level: 'entry' as any, // Default to entry for now
        status: status,
        skills_required: skills,
        requirements: cleanRequirements,
        company: org.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }

      const result = await createJob(jobData)
      if (result.success) {
        alert(status === 'active' ? "Job posted successfully!" : "Job saved as draft")
        router.push(`/${org}/jobs`)
      } else {
        if (result.error?.toLowerCase().includes('unauthorized')) {
          router.push('/login')
          return
        }

        alert("Error: " + result.error)
      }
    } catch (error) {
      console.error("Failed to create job:", error)
      alert("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Job Posting</h1>
          <p className="text-muted-foreground">Post a new position and start receiving applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')} 
            className="gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSubmit('active')} 
            className="gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4" />}
            Publish Job
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="basic" className="rounded-lg">Basic Info</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg">Job Details</TabsTrigger>
          <TabsTrigger value="requirements" className="rounded-lg">Requirements</TabsTrigger>
          <TabsTrigger value="preview" className="rounded-lg">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Senior Full Stack Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input 
                    id="department"
                    placeholder="e.g., Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input 
                    id="location"
                    placeholder="e.g., San Francisco, CA or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Employment Type *</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Full-time", value: "full-time" },
                    { label: "Part-time", value: "part-time" },
                    { label: "Contract", value: "contract" },
                    { label: "Internship", value: "internship" }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="jobType"
                        value={type.value}
                        checked={jobType === type.value}
                        onChange={(e) => setJobType(e.target.value as any)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Salary Range *</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin" className="text-sm text-muted-foreground">
                      Minimum
                    </Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="salaryMin"
                        placeholder="120,000"
                        className="pl-10"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax" className="text-sm text-muted-foreground">
                      Maximum
                    </Label>
                    <div className="relative">
                      <DollarSignIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="salaryMax"
                        placeholder="150,000"
                        className="pl-10"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>Detailed information about the role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Overview *</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[120px] px-3 py-2 border rounded-md"
                  placeholder="Provide a brief overview of the role and what the candidate will be doing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Responsibilities</CardTitle>
              <CardDescription>What the candidate will be responsible for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Input 
                    placeholder={`Responsibility ${index + 1}`}
                    value={responsibility}
                    onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {responsibilities.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveResponsibility(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddResponsibility}
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Responsibility
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Required education, experience, and qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Input 
                    placeholder={`Requirement ${index + 1}`}
                    value={requirement}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {requirements.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddRequirement}
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Requirement
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>Select technical skills needed for this position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Add custom skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                />
                <Button onClick={handleAddSkill} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleToggleSkill(skill)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      skills.includes(skill)
                        ? "bg-info/100 text-white"
                        : "bg-info/10 text-info hover:bg-info/20"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              {skills.length > 0 && (
                <div className="pt-3 border-t">
                  <Label className="text-sm mb-2 block">Selected Skills ({skills.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-3 py-1 bg-info/100 text-white rounded-md text-sm font-medium flex items-center gap-2"
                      >
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)}>
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{jobTitle || "Job Title"}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {department || "Department"} • {location || "Location"}
                  </CardDescription>
                </div>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                  {jobType}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Info */}
              <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Salary Range</div>
                    <div className="font-medium">
                      ${salaryMin || "Min"} - ${salaryMax || "Max"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{location || "Location"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium">{jobType}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {description && (
                <div>
                  <h3 className="font-semibold mb-2">About the Role</h3>
                  <p className="text-muted-foreground">{description}</p>
                </div>
              )}

              {/* Responsibilities */}
              {responsibilities.some(r => r.trim()) && (
                <div>
                  <h3 className="font-semibold mb-2">Key Responsibilities</h3>
                  <ul className="space-y-2">
                    {responsibilities
                      .filter(r => r.trim())
                      .map((responsibility, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{responsibility}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {requirements.some(r => r.trim()) && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="space-y-2">
                    {requirements
                      .filter(r => r.trim())
                      .map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{requirement}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="px-3 py-1 bg-info/10 text-info rounded-md text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex gap-3">
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => handleSubmit('active')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <PaperPlaneTilt className="h-4 w-4" />}
                  Publish Job Posting
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handleSubmit('draft')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

