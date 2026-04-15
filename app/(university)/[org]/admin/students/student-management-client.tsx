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
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  MagnifyingGlass,
  UserPlus as UserPlusIcon,
  FunnelSimple as Funnel,
  Users } from "@phosphor-icons/react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/header"


interface StudentManagementClientProps {
  org: string
}

export default function StudentManagementClient({ org }: StudentManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const { data, isPending } = useQuery({
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

  const handleAddStudent = () => {
    toast.info("Enrollment invitation flow is not configured yet. Please enable backend invite action first.")
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
                <Label htmlFor="email">Student Email</Label>
                <Input id="email" placeholder="student@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major / Department</Label>
                <Input id="major" placeholder="Computer Science" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStudent}>Send Invitation</Button>
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
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/${org}/admin/students/${student.profile_id || student.profiles?.id || student.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
