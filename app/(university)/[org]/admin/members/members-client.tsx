"use client"
// Members Management Client Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, Shield, MagnifyingGlass, Plus as PlusIcon, EnvelopeSimple as Envelope, Phone, Buildings, PencilSimple, Trash } from "@phosphor-icons/react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addFacultyMember, addAdminStaff, updateFacultyMember, deleteFacultyMember, deleteAdminStaff } from "@/lib/actions/university-actions"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { DashboardHeader } from "@/components/header"


interface FacultyMember {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  specialization: string
  created_at: string
}

interface AdminStaff {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  responsibilities: string
  created_at: string
}

interface MembersData {
  faculty: FacultyMember[]
  adminStaff: AdminStaff[]
}

export default function MembersClient({ initialMembers }: { initialMembers: MembersData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [addFacultyOpen, setAddFacultyOpen] = useState(false)
  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [editFacultyOpen, setEditFacultyOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<{ type: 'faculty' | 'admin', id: string } | null>(null)

  const [facultyMembers] = useState<FacultyMember[]>(initialMembers.faculty)
  const [adminStaff] = useState<AdminStaff[]>(initialMembers.adminStaff)

  const [newFaculty, setNewFaculty] = useState({
    name: "", email: "", phone: "", department: "", position: "", specialization: ""
  })

  const [newAdmin, setNewAdmin] = useState({
    name: "", email: "", phone: "", department: "", position: "", responsibilities: ""
  })

  const normalizedSearch = searchQuery.toLowerCase()

  const filteredFaculty = facultyMembers.filter(member =>
    member.name?.toLowerCase()?.includes(normalizedSearch) ||
    member.email?.toLowerCase()?.includes(normalizedSearch) ||
    member.department?.toLowerCase()?.includes(normalizedSearch)
  )

  const filteredAdmin = adminStaff.filter(member =>
    member.name?.toLowerCase()?.includes(normalizedSearch) ||
    member.email?.toLowerCase()?.includes(normalizedSearch) ||
    member.position?.toLowerCase()?.includes(normalizedSearch)
  )

  const handleAddFaculty = () => {
    if (!newFaculty.name || !newFaculty.email) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      try {
        const result = await addFacultyMember({
          name: newFaculty.name,
          email: newFaculty.email,
          phone: newFaculty.phone || "",
          department: newFaculty.department || "",
          position: newFaculty.position || "",
          specialization: newFaculty.specialization || ""
        })

        if (!result.success) {
          toast.error(result.error || "Failed to add faculty member")
          return
        }

          toast.success("Faculty member added successfully")
          setNewFaculty({ name: "", email: "", phone: "", department: "", position: "", specialization: "" })
          setAddFacultyOpen(false)
          router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to add faculty member")
      }
    })
  }

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      try {
        const result = await addAdminStaff({
          name: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone || "",
          department: newAdmin.department || "",
          position: newAdmin.position || "",
          responsibilities: newAdmin.responsibilities || ""
        })

        if (!result.success) {
          toast.error(result.error || "Failed to add admin staff")
          return
        }

          toast.success("Admin staff added successfully")
          setNewAdmin({ name: "", email: "", phone: "", department: "", position: "", responsibilities: "" })
          setAddAdminOpen(false)
          router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to add admin staff")
      }
    })
  }

  const handleEditFaculty = () => {
    if (!selectedFaculty) return

    startTransition(async () => {
      try {
        const result = await updateFacultyMember(selectedFaculty.id, {
          name: selectedFaculty.name,
          email: selectedFaculty.email,
          phone: selectedFaculty.phone,
          department: selectedFaculty.department,
          position: selectedFaculty.position,
          specialization: selectedFaculty.specialization
        })

        if (!result.success) {
          toast.error(result.error || "Failed to update faculty member")
          return
        }
        
        toast.success("Faculty member updated successfully")
        setEditFacultyOpen(false)
        setSelectedFaculty(null)
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to update faculty member")
      }
    })
  }

  const handleDelete = () => {
    if (!memberToDelete) return

    startTransition(async () => {
      try {
        if (memberToDelete.type === 'faculty') {
          const result = await deleteFacultyMember(memberToDelete.id)
          if (!result.success) {
            toast.error(result.error || "Failed to remove faculty member")
            return
          }
          toast.success("Faculty member removed successfully")
        } else {
          const result = await deleteAdminStaff(memberToDelete.id)
          if (!result.success) {
            toast.error(result.error || "Failed to remove admin staff")
            return
          }
          toast.success("Admin staff removed successfully")
        }
        
        setDeleteDialogOpen(false)
        setMemberToDelete(null)
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to delete member")
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <DashboardHeader title="Members" icon={Users} />
            <p className="text-muted-foreground">Manage faculty and administrative staff</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddAdminOpen(true)} disabled={isPending}>
              Add Admin
            </Button>
            <Button onClick={() => setAddFacultyOpen(true)} disabled={isPending}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Faculty
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facultyMembers.length}</div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Staff</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStaff.length}</div>
              <p className="text-xs text-muted-foreground">Administrative personnel</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facultyMembers.length + adminStaff.length}</div>
              <p className="text-xs text-muted-foreground">All staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Buildings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set([...facultyMembers.map(f => f.department), ...adminStaff.map(a => a.department)]).size}
              </div>
              <p className="text-xs text-muted-foreground">Active departments</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, email, or department..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faculty" className="space-y-5">
          <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
            <TabsTrigger value="faculty" className="rounded-lg">Faculty ({facultyMembers.length})</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg">Administrative Staff ({adminStaff.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="faculty" className="space-y-4">
            {filteredFaculty.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No faculty members found</p>
                  <Button onClick={() => setAddFacultyOpen(true)} className="mt-4">
                    Add Faculty Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFaculty.map((member) => (
                  <Card key={member.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <CardTitle>{member.name}</CardTitle>
                            <CardDescription>{member.position} • {member.department}</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={isPending}
                            onClick={() => {
                              setSelectedFaculty({ ...member })
                              setEditFacultyOpen(true)
                            }}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={isPending}
                            onClick={() => {
                              setMemberToDelete({ type: 'faculty', id: member.id })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Envelope className="h-4 w-4 text-muted-foreground" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Specialization:</span> {member.specialization || 'N/A'}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Join Date:</span> {formatDate(member.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            {filteredAdmin.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No administrative staff found</p>
                  <Button onClick={() => setAddAdminOpen(true)} className="mt-4">
                    Add Admin Staff
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAdmin.map((member) => (
                  <Card key={member.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <CardTitle>{member.name}</CardTitle>
                            <CardDescription>{member.position} • {member.department}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isPending}
                          onClick={() => {
                            setMemberToDelete({ type: 'admin', id: member.user_id })
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Envelope className="h-4 w-4 text-muted-foreground" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Responsibilities:</span> {member.responsibilities || 'N/A'}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Join Date:</span> {formatDate(member.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Faculty Dialog */}
      <Dialog open={addFacultyOpen} onOpenChange={setAddFacultyOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Faculty Member</DialogTitle>
            <DialogDescription>Invite a new faculty member to join the university</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input 
                  placeholder="Dr. John Doe" 
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  placeholder="john.doe@university.edu" 
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+1 (555) 123-4567" 
                  value={newFaculty.phone}
                  onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input 
                  placeholder="Computer Science" 
                  value={newFaculty.department}
                  onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input 
                  placeholder="Associate Professor" 
                  value={newFaculty.position}
                  onChange={(e) => setNewFaculty({ ...newFaculty, position: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Specialization</Label>
                <Input 
                  placeholder="Machine Learning" 
                  value={newFaculty.specialization}
                  onChange={(e) => setNewFaculty({ ...newFaculty, specialization: e.target.value })} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFacultyOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFaculty} disabled={isPending}>
              {isPending ? "Adding..." : "Add Faculty Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Faculty Dialog */}
      <Dialog open={editFacultyOpen} onOpenChange={setEditFacultyOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Faculty Member</DialogTitle>
            <DialogDescription>Update faculty member information</DialogDescription>
          </DialogHeader>
          {selectedFaculty && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={selectedFaculty.name}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, name: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={selectedFaculty.email}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, email: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={selectedFaculty.phone}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, phone: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    value={selectedFaculty.department}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, department: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input 
                    value={selectedFaculty.position}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, position: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input 
                    value={selectedFaculty.specialization}
                    onChange={(e) => setSelectedFaculty({ ...selectedFaculty, specialization: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFacultyOpen(false)}>Cancel</Button>
            <Button onClick={handleEditFaculty} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Admin Staff</DialogTitle>
            <DialogDescription>Add new administrative staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input 
                  placeholder="Jane Smith" 
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  placeholder="jane.smith@university.edu" 
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+1 (555) 123-4567" 
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input 
                  placeholder="Administration" 
                  value={newAdmin.department}
                  onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input 
                placeholder="Registrar" 
                value={newAdmin.position}
                onChange={(e) => setNewAdmin({ ...newAdmin, position: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea 
                placeholder="Describe main responsibilities..." 
                value={newAdmin.responsibilities}
                onChange={(e) => setNewAdmin({ ...newAdmin, responsibilities: e.target.value })} 
                rows={3} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAdmin} disabled={isPending}>
              {isPending ? "Adding..." : "Add Admin Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
