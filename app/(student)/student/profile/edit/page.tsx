"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadSimple, Plus as PlusIcon, X as XIcon, FloppyDisk, ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { getStudentProfileEditBootstrap, updateStudentProfile, updateUserProfile, createUserSkill, deleteUserSkill } from "@/lib/actions/database"
import { useRouter } from "next/navigation"

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile data
  const [profileId, setProfileId] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  
  // Student data
  const [university, setUniversity] = useState("")
  const [major, setMajor] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [gpa, setGpa] = useState("")
  const [bio, setBio] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  
  // Skills from database (from user_skills table, not students.skills)
  const [skills, setSkills] = useState<Array<{id: string, skill_name: string}>>([])
  const [newSkill, setNewSkill] = useState("")
  const [skillsLoading, setSkillsLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const bootstrap = await getStudentProfileEditBootstrap()
        if (!bootstrap?.profile) {
          router.push('/login')
          return
        }

        const profile = bootstrap.profile
        const student = bootstrap.student

        // Set profile data
        setProfileId(profile.id)
        setFullName(profile.full_name || "")
        setEmail(profile.email || "")
        setPhone(profile.phone || "")
        setAvatarUrl(profile.avatar_url || "")

        // Set student data
        setUniversity(student?.university || "")
        setMajor(student?.major || "")
        setGraduationYear(student?.graduation_year || "")
        setGpa(student?.gpa?.toString() || "")
        setBio(student?.bio || "")
        setLinkedinUrl(student?.linkedin_url || "")
        setGithubUrl(student?.github_url || "")
        setPortfolioUrl(student?.portfolio_url || "")
        
        // Load skills from bootstrap payload
        setSkills(bootstrap.skills || [])

        setLoading(false)
      } catch (error) {
        console.error('Error loading profile:', error)
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert('Full Name is required')
      return
    }

    setSaving(true)
    try {
      // Update profile table
      await updateUserProfile(profileId, {
        full_name: fullName,
        phone: phone })

      // Update students table
      await updateStudentProfile(profileId, {
        university,
        major,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        bio,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl })

      alert('Profile updated successfully!')
      router.push('/student/profile')
      router.refresh()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async () => {
    const skillName = newSkill.trim()
    if (!skillName) return
    
    // Check if skill already exists
    if (skills.some(s => s.skill_name.toLowerCase() === skillName.toLowerCase())) {
      alert('This skill already exists')
      return
    }
    
    setSkillsLoading(true)
    try {
      // Persist to database immediately
      const newSkillData = await createUserSkill(profileId, skillName)
      
      if (newSkillData) {
        // Update UI only after successful database write
        setSkills([...skills, newSkillData])
        setNewSkill("")
      } else {
        alert('Failed to add skill. Please try again.')
      }
    } catch (error) {
      console.error('Error adding skill:', error)
      alert('Failed to add skill. Please try again.')
    } finally {
      setSkillsLoading(false)
    }
  }

  const removeSkill = async (skillId: string) => {
    setSkillsLoading(true)
    try {
      // Delete from database immediately
      const success = await deleteUserSkill(skillId)
      
      if (success) {
        // Update UI only after successful database deletion
        setSkills(skills.filter(s => s.id !== skillId))
      } else {
        alert('Failed to remove skill. Please try again.')
      }
    } catch (error) {
      console.error('Error removing skill:', error)
      alert('Failed to remove skill. Please try again.')
    } finally {
      setSkillsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/student/profile">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Profile</h1>
          </div>
          <p className="text-muted-foreground ml-12">Update your profile information and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild disabled={saving}>
            <Link href="/student/profile">Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <FloppyDisk className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile photo</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-2xl">
                  {fullName.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline">
                  <UploadSimple className="h-4 w-4 mr-2" />
                  Upload New Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">About Me</Label>
                <Textarea
                  id="bio"
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for your profile. Max 500 characters.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Add your professional profiles and portfolio links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Profile</Label>
                <Input 
                  id="github" 
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input 
                  id="linkedin" 
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio Website</Label>
                <Input 
                  id="portfolio" 
                  placeholder="https://yourportfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Education</CardTitle>
              <CardDescription>Update your current academic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University/Institution</Label>
                <Input 
                  id="university" 
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Enter your university name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major/Field of Study</Label>
                <Input 
                  id="major" 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradYear">Expected Graduation Year</Label>
                <Input 
                  id="gradYear" 
                  type="number" 
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g., 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA</Label>
                <Input 
                  id="gpa" 
                  type="number" 
                  step="0.01"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g., 3.8"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Skills</CardTitle>
              <CardDescription>Manage your technical skills and proficiencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skill-input">Add Skill</Label>
                <div className="flex gap-2">
                  <Input
                    id="skill-input"
                    placeholder="e.g., JavaScript, Python, etc."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    disabled={skillsLoading}
                  />
                  <Button onClick={addSkill} disabled={skillsLoading}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {skillsLoading ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Your Skills</Label>
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg min-h-[100px]">
                  {skillsLoading && skills.length === 0 ? (
                    <>
                      <Skeleton className="h-7 w-24 rounded-full" />
                      <Skeleton className="h-7 w-28 rounded-full" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                    </>
                  ) : skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm flex items-center gap-1"
                      >
                        {skill.skill_name}
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                          disabled={skillsLoading}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

