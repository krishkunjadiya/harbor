'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { 
  MagnifyingGlass,
  UserPlus as UserPlusIcon,
  FunnelSimple as Funnel,
  Users,
  DotsThree,
  Trash,
  SpinnerGap
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/header"


interface StudentManagementClientProps {
  org: string
}

export default function StudentManagementClient({ org }: StudentManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [newStudentData, setNewStudentData] = useState({
    email: '',
    major: '',
    fullName: '',
    graduationYear: new Date().getFullYear() + 4 + ''
  })
  
  // Track which student is being deleted
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)

  const { data, isPending, refetch } = useQuery({
    queryKey: ['university', 'admin-students', org],
    queryFn: async () => {
      const response = await fetch('/api/university/admin-students', {
        method: 'GET',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Failed to load students')
      }

      return response.json() as Promise<{ students: any[] }>
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const students = data?.students || []
  const loading = isPending

  const normalizedSearch = searchQuery.toLowerCase().trim()
  const searchTokens = normalizedSearch.split(/\s+/).filter(Boolean)

  const filteredStudents = students.filter(s => {
    if (searchTokens.length === 0) {
      return true
    }

    const searchableText = [
      s.profiles?.full_name,
      s.profiles?.email,
      s.major,
      s.program,
      s.university,
      s.graduation_year,
      s.gpa,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchedTokens = searchTokens.filter((token) => searchableText.includes(token)).length
    const minMatchedTokens = Math.max(1, Math.ceil(searchTokens.length * 0.6))
    return matchedTokens >= minMatchedTokens
  })

  const handleAddStudent = async () => {
    if (!newStudentData.email) {
      return toast.error("Email is required.")
    }
    
    setLoadingAction(true)
    try {
      const response = await fetch('/api/university/admin-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: newStudentData.email,
          fullName: newStudentData.fullName,
          major: newStudentData.major,
          graduationYear: newStudentData.graduationYear,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        toast.error(payload?.error || "Failed to enroll student.")
        return
      }

      toast.success("Student enrolled successfully! They will receive login instructions.")
      setNewStudentData({ email: '', major: '', fullName: '', graduationYear: new Date().getFullYear() + 4 + '' })
      setIsAddDialogOpen(false)
      refetch() // refresh the react-query data
    } catch (e: any) {
      toast.error("Internal error occurred.")
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    setLoadingAction(true)
    try {
      const response = await fetch(`/api/university/admin-students?studentId=${encodeURIComponent(studentId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        toast.error(payload?.error || "Failed to remove student.")
        return
      }
      toast.success("Student removed successfully.")
      setDeleteStudentId(null)
      refetch()
    } catch(e: any) {
      toast.error("Internal error occurred.")
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <DashboardHeader title="Student Enrollment" icon={Users} />
          <p className="text-muted-foreground">Manage student records and institution enrollment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlusIcon className="h-4 w-4" />
              Enroll Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enroll New Student</DialogTitle>
              <DialogDescription>Add a student to your university database</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" value={newStudentData.fullName} onChange={(e) => setNewStudentData({ ...newStudentData, fullName: e.target.value })} disabled={loadingAction} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Student Email</Label>
                <Input id="email" type="email" placeholder="student@example.com" value={newStudentData.email} onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })} disabled={loadingAction} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major / Department</Label>
                  <Input id="major" placeholder="Computer Science" value={newStudentData.major} onChange={(e) => setNewStudentData({ ...newStudentData, major: e.target.value })} disabled={loadingAction} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Input id="gradYear" type="number" placeholder="2027" value={newStudentData.graduationYear} onChange={(e) => setNewStudentData({ ...newStudentData, graduationYear: e.target.value })} disabled={loadingAction} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loadingAction}>Cancel</Button>
              <Button onClick={handleAddStudent} disabled={loadingAction}>
                {loadingAction ? <SpinnerGap className="animate-spin w-4 h-4 mr-2" /> : null}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students by name, email, or major..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Funnel className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Graduation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <TableRow>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                </>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No students found</TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.profiles?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{student.profiles?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.major || 'Undeclared'}</TableCell>
                    <TableCell>{student.graduation_year || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Enrolled
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <DotsThree className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${org}/faculty/students/${student.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteStudentId(student.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteStudentId} onOpenChange={(val) => !val && setDeleteStudentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove this student? This action cannot be undone and will delete their academic records and job application data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteStudentId(null)} disabled={loadingAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteStudentId && handleDeleteStudent(deleteStudentId)} disabled={loadingAction}>
              {loadingAction ? <SpinnerGap className="animate-spin w-4 h-4 mr-2" /> : null}
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
