'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus as PlusIcon, Users, EnvelopeSimple as Envelope, Phone, IdentificationBadge as BadgeIcon, DotsThree } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addAdminStaff, addFacultyMember } from '@/lib/actions/university-actions'

interface FacultyManagementClientProps {
  facultyAndStaff: any[]
  orgId: string
}

export function FacultyManagementClient({ facultyAndStaff: initialData, orgId }: FacultyManagementClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [members, setMembers] = useState(initialData)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'faculty',
    department: '',
    designation: '',
    specialization: ''
  })

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.role) {
      toast.error('Please fill in all required fields')
      return
    }

    startTransition(async () => {
      try {
        const result = newMember.role === 'admin-staff'
          ? await addAdminStaff({
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone || '',
              department: newMember.department || '',
              position: newMember.designation || '',
              responsibilities: ''
            })
          : await addFacultyMember({
              name: newMember.name,
              email: newMember.email,
              phone: newMember.phone || '',
              department: newMember.department || '',
              position: newMember.designation || '',
              specialization: newMember.specialization || ''
            })

        if (!result.success) {
          toast.error(result.error || 'Failed to add member')
          return
        }

        toast.success(newMember.role === 'admin-staff' ? 'Admin staff added successfully' : 'Faculty member added successfully')
        setNewMember({
          name: '',
          email: '',
          phone: '',
          role: 'faculty',
          department: '',
          designation: '',
          specialization: ''
        })
        setIsCreateDialogOpen(false)
        router.refresh()
      } catch (error: any) {
        toast.error(error?.message || 'Failed to add member')
      }
    })
  }

  const filteredMembers = members.filter(m => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    const searchableText = [
      m.name,
      m.email,
      m.phone,
      m.role,
      m.department,
      m.designation,
      m.specialization,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const tokens = normalizedSearch.split(/\s+/).filter(Boolean)
    const matchedTokens = tokens.filter((token) => searchableText.includes(token)).length
    const minMatchedTokens = Math.max(1, Math.ceil(tokens.length * 0.6))
    const matchesSearch = tokens.length === 0 || matchedTokens >= minMatchedTokens

    if (roleFilter === 'all') return matchesSearch
    return matchesSearch && m.role === roleFilter
  })

  const stats = {
    total: members.length,
    faculty: members.filter(m => m.role === 'faculty').length,
    staff: members.filter(m => m.role === 'admin-staff').length,
    active: members.filter(m => (m.status ?? 'active') === 'active').length
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'faculty':
        return 'bg-info/15 text-info'
      case 'admin-staff':
        return 'bg-primary/15 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Add Member Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Member
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Faculty/Staff Member</DialogTitle>
            <DialogDescription>Add a new faculty member or staff member to the system</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Ahmed Khan"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+92 300 1234567"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newMember.role} onValueChange={(val) => setNewMember({...newMember, role: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="admin-staff">Admin Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science"
                  value={newMember.department}
                  onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g., Associate Professor"
                  value={newMember.designation}
                  onChange={(e) => setNewMember({...newMember, designation: e.target.value})}
                />
              </div>
            </div>

            {newMember.role === 'faculty' && (
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  placeholder="e.g., Machine Learning, Data Science"
                  value={newMember.specialization}
                  onChange={(e) => setNewMember({...newMember, specialization: e.target.value})}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={isPending}>{isPending ? 'Adding...' : 'Add Member'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <BadgeIcon className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.faculty}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <BadgeIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.staff}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name, email, role, department, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="admin-staff">Admin Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-sm text-muted-foreground">Add your first faculty or staff member</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        {member.specialization && (
                          <p className="text-xs text-muted-foreground">{member.specialization}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Envelope className="h-4 w-4 text-muted-foreground" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role === 'faculty' ? 'Faculty' : 'Admin Staff'}
                    </span>
                  </TableCell>
                  <TableCell>{member.department || '-'}</TableCell>
                  <TableCell>{member.designation || '-'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                      Active
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <DotsThree className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
