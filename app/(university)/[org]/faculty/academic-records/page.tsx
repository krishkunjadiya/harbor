"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, MagnifyingGlass, CheckCircle, Clock, WarningCircle, DownloadSimple as Download, Eye, ShieldCheck as ShieldCheckIcon, Calendar } from "@phosphor-icons/react/dist/ssr"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  getAcademicRecordsByFaculty, 
  verifyAcademicRecord,
  bulkVerifyAcademicRecords
} from "@/lib/actions/database"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/header"
import { GraduationCap as FacultyIcon } from "@phosphor-icons/react"


export default function AcademicRecordsPage() {
  const params = useParams()
  const router = useRouter()
  const org = params?.org as string
  
  const [searchQuery, setSearchQuery] = useState("")
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDetailsModal, setViewDetailsModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const fetchRecords = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/${org}/login`)
      return
    }
    
    const recordsData = await getAcademicRecordsByFaculty(user.id)
    
    // Transform database records to component format
    const transformedRecords = recordsData.map((r: any) => ({
      id: r.id,
      studentName: r.student?.full_name || r.student_name || 'Unknown Student',
      studentId: r.student_id,
      course: `${r.course?.code || r.course?.course_code || r.course_code || 'N/A'} - ${r.course?.name || r.course?.course_name || r.course_name || 'Unknown'}`,
      semester: r.semester,
      grade: r.grade,
      credits: r.credits,
      status: r.verified ? 'verified' : 'pending',
      submittedDate: r.submitted_date,
      verifiedDate: r.verified_date
    }))
    
    setRecords(transformedRecords)
    setLoading(false)
  }, [router, org])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleVerifyRecord = async (record: any) => {
    setIsVerifying(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const result = await verifyAcademicRecord(record.id, user.id)
    
    if (result) {
      setSuccess(`Record for ${record.studentName} verified successfully`)
      await fetchRecords()
    } else {
      setError("Failed to verify record")
    }
    setIsVerifying(false)
    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
  }

  const handleBulkVerify = async () => {
    const pendingIds = records.filter(r => r.status === 'pending').map(r => r.id)
    if (pendingIds.length === 0) return

    setIsVerifying(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const result = await bulkVerifyAcademicRecords(pendingIds, user.id)
      if (result) {
        setSuccess(`Verified ${pendingIds.length} records successfully`)
        await fetchRecords()
      } else {
        setError("Failed to verify records")
      }
    }
    setIsVerifying(false)
    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
  }

  const handleDownloadRecord = (record: any) => {
    const content = `Academic Record - ${record.studentName}\n\nStudent ID: ${record.studentId}\nCourse: ${record.course}\nGrade: ${record.grade}\nCredits: ${record.credits}\nSemester: ${record.semester}\nSubmitted: ${record.submittedDate}`
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content))
    element.setAttribute("download", `${record.studentId}_record.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setSuccess(`Record for ${record.studentName} downloaded successfully`)
    setTimeout(() => setSuccess(null), 5000)
  }

  const handleExportRecords = () => {
    const csvContent = [
      ['Student Name', 'Student ID', 'Course', 'Grade', 'Credits', 'Semester', 'Status'],
      ...records.map(r => [r.studentName, r.studentId, r.course, r.grade, r.credits, r.semester, r.status])
    ].map(row => row.join(',')).join('\n')
    
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent))
    element.setAttribute("download", "academic_records.csv")
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setSuccess(`Exported ${records.length} records to CSV`)
    setTimeout(() => setSuccess(null), 5000)
  }

  const filteredRecords = records.filter(record =>
    record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.course.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-success" />
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />
      case "requires-review":
        return <WarningCircle className="h-4 w-4 text-warning" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-success/10 text-success"
      case "pending":
        return "bg-warning/10 text-warning"
      case "requires-review":
        return "bg-warning/10 text-warning"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Academic Records" icon={FacultyIcon} />
        <p className="text-muted-foreground">Manage and verify student academic records</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-success/10 border-success/30">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "verified").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((records.filter(r => r.status === "verified").length / records.length) * 100)}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requires Review</CardTitle>
            <WarningCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "requires-review").length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, ID, or course..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="space-y-5">
        <TabsList className="h-auto gap-1 rounded-xl border bg-background p-1">
          <TabsTrigger value="all" className="rounded-lg">
            All ({records.length})
          </TabsTrigger>
          <TabsTrigger value="verified" className="rounded-lg">
            Verified ({records.filter(r => r.status === "verified").length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">
            Pending ({records.filter(r => r.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{record.studentName}</h3>
                            <span className="text-sm text-muted-foreground">{record.studentId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status.replace("-", " ")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{record.course}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Grade</p>
                            <p className="font-semibold text-lg">{record.grade}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Credits</p>
                            <p className="font-semibold">{record.credits}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Semester</p>
                            <p className="font-semibold">{record.semester}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                            <p className="font-semibold">{record.submittedDate}</p>
                          </div>
                        </div>

                        {record.verifiedDate && (
                          <div className="flex items-center gap-2 text-xs text-success">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Verified on {record.verifiedDate}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Dialog open={viewDetailsModal && selectedRecord?.id === record.id} onOpenChange={(open) => !open && setViewDetailsModal(false)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setSelectedRecord(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-x-2">Record Details</DialogTitle>
                            <DialogDescription>Detailed information for {selectedRecord?.studentName}'s academic record</DialogDescription>
                          </DialogHeader>
                          <RecordDetailsView record={selectedRecord} onClose={() => setViewDetailsModal(false)} />
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="icon" onClick={() => handleDownloadRecord(record)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {record.status !== "verified" && (
                        <Button 
                          size="sm" 
                          className="gap-2" 
                          onClick={() => handleVerifyRecord(record)}
                          disabled={isVerifying}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isVerifying ? "Verifying..." : "Verify"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <div className="space-y-3">
            {filteredRecords
              .filter(r => r.status === "verified")
              .map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{record.studentName}</h3>
                              <span className="text-sm text-muted-foreground">{record.studentId}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{record.course}</p>
                          </div>

                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Grade</p>
                              <p className="font-semibold text-lg">{record.grade}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Credits</p>
                              <p className="font-semibold">{record.credits}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Verified</p>
                              <p className="font-semibold">{record.verifiedDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Dialog open={viewDetailsModal && selectedRecord?.id === record.id} onOpenChange={(open) => !open && setViewDetailsModal(false)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setSelectedRecord(record)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-x-2">Record Details</DialogTitle>
                              <DialogDescription>Detailed information for {selectedRecord?.studentName}'s academic record</DialogDescription>
                            </DialogHeader>
                            <RecordDetailsView record={selectedRecord} onClose={() => setViewDetailsModal(false)} />
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="icon" onClick={() => handleDownloadRecord(record)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-3">
            {filteredRecords
              .filter(r => r.status === "pending")
              .map((record) => (
                <Card key={record.id} className="border-warning/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                          <Clock className="h-6 w-6 text-warning" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{record.studentName}</h3>
                            <span className="text-sm text-muted-foreground">{record.studentId}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{record.course}</p>

                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Grade</p>
                              <p className="font-semibold text-lg">{record.grade}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Credits</p>
                              <p className="font-semibold">{record.credits}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Submitted</p>
                              <p className="font-semibold">{record.submittedDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Dialog open={viewDetailsModal && selectedRecord?.id === record.id} onOpenChange={(open) => !open && setViewDetailsModal(false)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => setSelectedRecord(record)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-x-2">Record Details</DialogTitle>
                              <DialogDescription>Detailed information for {selectedRecord?.studentName}'s academic record</DialogDescription>
                            </DialogHeader>
                            <RecordDetailsView record={selectedRecord} onClose={() => setViewDetailsModal(false)} />
                          </DialogContent>
                        </Dialog>

                        <Dialog open={reviewModal && selectedRecord?.id === record.id} onOpenChange={(open) => !open && setReviewModal(false)}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2" onClick={() => setSelectedRecord(record)}>
                              <CheckCircle className="h-4 w-4" />
                              Verify
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-x-2">Verify Record</DialogTitle>
                              <DialogDescription>Confirm verification for {selectedRecord?.studentName}'s record</DialogDescription>
                            </DialogHeader>
                            <VerifyRecordForm record={selectedRecord} onVerify={() => { handleVerifyRecord(selectedRecord); setReviewModal(false); }} onCancel={() => setReviewModal(false)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No records found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>Perform actions on multiple records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleBulkVerify}
              disabled={isVerifying}
            >
              <CheckCircle className="h-4 w-4" />
              {isVerifying ? "Verifying..." : "Verify All Pending"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportRecords}>
              <Download className="h-4 w-4" />
              Export Records
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              setSuccess(`Generated academic report with ${records.length} records`)
              setTimeout(() => setSuccess(null), 5000)
            }}>
              <Calendar className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RecordDetailsView({ record, onClose }: { record: any; onClose: () => void }) {
  if (!record) return null
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Student Name</Label>
          <p className="font-semibold">{record.studentName}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Student ID</Label>
          <p className="font-semibold">{record.studentId}</p>
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Course</Label>
          <p className="font-semibold">{record.course}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Grade</Label>
          <p className="font-semibold text-lg">{record.grade}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Credits</Label>
          <p className="font-semibold">{record.credits}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Semester</Label>
          <p className="font-semibold">{record.semester}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <p className="font-semibold capitalize">{record.status}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Submitted Date</Label>
          <p className="font-semibold">{record.submittedDate}</p>
        </div>
        {record.verifiedDate && (
          <div>
            <Label className="text-xs text-muted-foreground">Verified Date</Label>
            <p className="font-semibold">{record.verifiedDate}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

function VerifyRecordForm({ record, onVerify, onCancel }: { record: any; onVerify: () => void; onCancel: () => void }) {
  if (!record) return null

  return (
    <div className="space-y-4">
      <p className="text-sm">Are you sure you want to verify this academic record?</p>
      <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Student:</span>
          <span className="font-semibold">{record.studentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Course:</span>
          <span className="font-semibold">{record.course}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Grade:</span>
          <span className="font-semibold">{record.grade}</span>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onVerify}>Verify Record</Button>
      </div>
    </div>
  )
}

