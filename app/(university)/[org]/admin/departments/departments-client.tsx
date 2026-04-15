"use client"
// Departments Management Client Component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Buildings, Users, GraduationCap, Medal, MagnifyingGlass, Plus as PlusIcon, Gear, TrendUp, PencilSimple, Trash } from "@phosphor-icons/react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createDepartment, updateDepartment, deleteDepartment } from "@/lib/actions/university-actions"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/header"


interface Department {
  id: string
  name: string
  code: string
  description: string
  head_of_department?: string
  created_at: string
  faculty_count?: number
}

export default function DepartmentsClient({ initialDepartments }: { initialDepartments: Department[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null)
  
  const [newDept, setNewDept] = useState({
    name: "",
    code: "",
    description: "",
    head_of_department: ""
  })

  const [departments] = useState<Department[]>(initialDepartments)

  const normalizedSearch = searchQuery.toLowerCase()

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase()?.includes(normalizedSearch) ||
    dept.code?.toLowerCase()?.includes(normalizedSearch)
  )

  const handleAddDepartment = () => {
    if (!newDept.name || !newDept.code) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      try {
        const result = await createDepartment({
          name: newDept.name,
          code: newDept.code,
          description: newDept.description || "",
          head_of_department: newDept.head_of_department || ""
        })
        
        if (result.success) {
          toast.success("Department created successfully")
          setNewDept({ name: "", code: "", description: "", head_of_department: "" })
          setAddDialogOpen(false)
          router.refresh()
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to create department")
      }
    })
  }

  const handleEditDepartment = () => {
    if (!selectedDept) return

    startTransition(async () => {
      try {
        const result = await updateDepartment(selectedDept.id, {
          name: selectedDept.name,
          code: selectedDept.code,
          description: selectedDept.description,
          head_of_department: selectedDept.head_of_department
        })

        if (!result.success) {
          toast.error(result.error || "Failed to update department")
          return
        }
        
        toast.success("Department updated successfully")
        setEditDialogOpen(false)
        setSelectedDept(null)
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to update department")
      }
    })
  }

  const handleDeleteDepartment = () => {
    if (!deptToDelete) return

    startTransition(async () => {
      try {
        const result = await deleteDepartment(deptToDelete)

        if (!result.success) {
          toast.error(result.error || "Failed to delete department")
          return
        }

        toast.success("Department deleted successfully")
        setDeleteDialogOpen(false)
        setDeptToDelete(null)
        router.refresh()
      } catch (error: any) {
        toast.error(error.message || "Failed to delete department")
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <DashboardHeader title="Departments" icon={Buildings} />
            <p className="text-muted-foreground">Manage university departments and programs</p>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)} disabled={isPending}>
            <PlusIcon className="h-4 w-4" />
            Add Department
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
              <Buildings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-xs text-muted-foreground">Active programs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.reduce((sum, d) => sum + (d.faculty_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
              <TrendUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-xs text-muted-foreground">Running this semester</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Established</CardTitle>
              <Buildings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.length > 0 ? new Date(departments[0].created_at).getFullYear() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Oldest department</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments by name or code..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Departments Grid */}
        {filteredDepartments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Buildings className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {departments.length === 0 ? "No departments yet" : "No departments found"}
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDepartments.map((dept) => (
              <Card key={dept.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Buildings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <CardDescription>Code: {dept.code}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={isPending}
                        onClick={() => {
                          setSelectedDept({ ...dept })
                          setEditDialogOpen(true)
                        }}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        disabled={isPending}
                        onClick={() => {
                          setDeptToDelete(dept.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{dept.description || 'No description available'}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <GraduationCap className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-xs text-muted-foreground">Faculty</p>
                        <p className="text-sm font-semibold">{dept.faculty_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Buildings className="h-4 w-4 text-info" />
                      <div>
                        <p className="text-xs text-muted-foreground">Established</p>
                        <p className="text-sm font-semibold">{new Date(dept.created_at).getFullYear()}</p>
                      </div>
                    </div>
                  </div>

                  {dept.head_of_department && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Head of Department</p>
                      <p className="text-sm font-medium">{dept.head_of_department}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Department Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>Create a new department with basic information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Computer Science"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code *</Label>
              <Input
                id="code"
                placeholder="e.g., CS"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hod">Head of Department</Label>
              <Input
                id="hod"
                placeholder="e.g., Dr. Sarah Johnson"
                value={newDept.head_of_department}
                onChange={(e) => setNewDept({ ...newDept, head_of_department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the department..."
                value={newDept.description}
                onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddDepartment} disabled={isPending}>
              {isPending ? "Creating..." : "Add Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          {selectedDept && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  value={selectedDept.name}
                  onChange={(e) => setSelectedDept({ ...selectedDept, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Department Code</Label>
                <Input
                  id="edit-code"
                  value={selectedDept.code}
                  onChange={(e) => setSelectedDept({ ...selectedDept, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hod">Head of Department</Label>
                <Input
                  id="edit-hod"
                  value={selectedDept.head_of_department || ''}
                  onChange={(e) => setSelectedDept({ ...selectedDept, head_of_department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedDept.description}
                  onChange={(e) => setSelectedDept({ ...selectedDept, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditDepartment} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDepartment} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
