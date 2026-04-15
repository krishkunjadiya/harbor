'use server'

import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from 'next/cache'
import * as xlsx from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type ReportFormat = 'csv' | 'excel' | 'pdf'

type ReportType = 'applications' | 'candidates' | 'interviews' | 'performance'

export interface ReportStatusPreview {
  reportType: ReportType
  total: number
  counts: Array<{
    label: string
    count: number
  }>
}

export interface GeneratedReportFile {
  fileName: string
  mimeType: string
  contentBase64: string
  reportType: string
  format: ReportFormat
  dateRange: number
}

function toBase64FromText(content: string) {
  return Buffer.from(content, 'utf-8').toString('base64')
}

function toBase64FromBuffer(content: ArrayBuffer) {
  return Buffer.from(content).toString('base64')
}

function toCsvCell(value: unknown) {
  const normalized = value === null || value === undefined ? 'N/A' : String(value)
  return `"${normalized.replace(/"/g, '""')}"`
}

function groupCountByLabel(values: Array<string | null | undefined>, emptyLabel = 'Unknown') {
  const counts = values.reduce<Record<string, number>>((acc, raw) => {
    const key = (raw || '').trim() || emptyLabel
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

function normalizeRangeDays(days: number) {
  const parsed = Number(days)
  if (!Number.isFinite(parsed)) {
    return 30
  }

  return parsed > 0 ? Math.floor(parsed) : 0
}

function getDateLimitIso(days: number) {
  if (days <= 0) {
    return null
  }

  const dateLimit = new Date()
  dateLimit.setDate(dateLimit.getDate() - days)
  return dateLimit.toISOString()
}

async function getRecruiterScopedJobIds(recruiterId: string) {
  noStore()
  const supabase = await createClient()

  let recruiterRecord: any = null

  const canonicalRecruiterRes = await supabase
    .from('recruiters')
    .select('id, profile_id, company, company_name')
    .eq('profile_id', recruiterId)
    .maybeSingle()

  if (canonicalRecruiterRes.error) {
    console.error('Error resolving canonical recruiter scope for reports:', canonicalRecruiterRes.error)
  } else {
    recruiterRecord = canonicalRecruiterRes.data || null
  }

  if (!recruiterRecord) {
    const legacyRecruiterRes = await supabase
      .from('recruiters')
      .select('id, profile_id, company, company_name')
      .eq('id', recruiterId)
      .maybeSingle()

    if (legacyRecruiterRes.error) {
      console.error('Error resolving legacy recruiter scope for reports:', legacyRecruiterRes.error)
    } else {
      recruiterRecord = legacyRecruiterRes.data || null
    }
  }
  const recruiterIds = Array.from(
    new Set([
      recruiterId,
      recruiterRecord?.profile_id,
      recruiterRecord?.id,
    ].filter((value): value is string => Boolean(value)))
  )

  const companyNames = Array.from(
    new Set(
      [recruiterRecord?.company_name, recruiterRecord?.company]
        .map((value) => (value || '').trim())
        .filter((value) => value.length > 0)
    )
  )

  const jobFetches = []

  if (recruiterIds.length > 0) {
    jobFetches.push(
      supabase
        .from('jobs')
        .select('id')
        .in('recruiter_id', recruiterIds)
    )
  }

  if (companyNames.length > 0) {
    jobFetches.push(
      supabase
        .from('jobs')
        .select('id')
        .in('company', companyNames)
    )
  }

  if (jobFetches.length === 0) {
    return []
  }

  const jobResults = await Promise.all(jobFetches)

  for (const result of jobResults) {
    if (result.error) {
      console.error('Error fetching scoped jobs for reports:', result.error)
    }
  }

  const allJobs = jobResults.flatMap((result) => result.data || [])

  const uniqueJobIds = Array.from(
    new Set(allJobs.map((job) => job.id))
  )

  return uniqueJobIds
}

type ApplicationsReportRow = {
  id: string
  status: string | null
  applied_at: string | null
  updated_at: string | null
  cover_letter: string | null
  job: {
    title: string | null
    company: string | null
    location: string | null
  } | null
  profile: {
    full_name: string | null
    email: string | null
    phone: string | null
  } | null
  student: {
    enrollment_number: string | null
    program: string | null
    department: string | null
    major: string | null
    university: string | null
    gpa: number | null
    graduation_year: number | null
  } | null
}

async function getApplicationsReportData(recruiterId: string, days: number): Promise<ApplicationsReportRow[]> {
  noStore()
  const supabase = await createClient()
  const rangeDays = normalizeRangeDays(days)
  const dateLimitIso = getDateLimitIso(rangeDays)

  const jobIds = await getRecruiterScopedJobIds(recruiterId)
  if (jobIds.length === 0) {
    return []
  }

  let applicationsQuery = supabase
    .from('job_applications')
    .select(`
      id,
      status,
      applied_at,
      updated_at,
      cover_letter,
      job_id,
      student_id,
      job:jobs!inner(title, company, location)
    `)
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false })

  if (dateLimitIso) {
    applicationsQuery = applicationsQuery.or(`applied_at.gte.${dateLimitIso},updated_at.gte.${dateLimitIso}`)
  }

  const { data: applications, error } = await applicationsQuery

  if (error || !applications) {
    console.error('Error generating applications report data:', error)
    return []
  }

  const studentIds = Array.from(
    new Set(applications.map((app: any) => app.student_id).filter(Boolean))
  ) as string[]

  let profileMap = new Map<string, any>()
  let studentMap = new Map<string, any>()

  if (studentIds.length > 0) {
    const [profilesRes, studentsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', studentIds),
      supabase
        .from('students')
        .select('profile_id, enrollment_number, program, department, major, university, gpa, graduation_year')
        .in('profile_id', studentIds),
    ])

    if (profilesRes.error) {
      console.error('Error fetching profile data for reports:', profilesRes.error)
    } else {
      for (const profile of profilesRes.data || []) {
        profileMap.set(profile.id, profile)
      }
    }

    if (studentsRes.error) {
      console.error('Error fetching student data for reports:', studentsRes.error)
    } else {
      for (const student of studentsRes.data || []) {
        studentMap.set(student.profile_id, student)
      }
    }
  }

  return applications.map((app: any) => ({
    id: app.id,
    status: app.status || null,
    applied_at: app.applied_at || null,
    updated_at: app.updated_at || null,
    cover_letter: app.cover_letter || null,
    job: app.job || null,
    profile: profileMap.get(app.student_id) || null,
    student: studentMap.get(app.student_id) || null,
  }))
}

export async function generateApplicationsCSV(recruiterId: string, days = 30) {
  const applications = await getApplicationsReportData(recruiterId, days)

  const headers = [
    'Applicant Name',
    'Email',
    'Phone',
    'Job Title',
    'Company',
    'Location',
    'Status',
    'Applied Date',
    'Program',
    'Department',
    'Major',
    'University',
    'Enrollment Number',
    'GPA',
    'Graduation Year',
  ]

  const rows = applications.map((app) => [
    toCsvCell(app.profile?.full_name),
    toCsvCell(app.profile?.email),
    toCsvCell(app.profile?.phone),
    toCsvCell(app.job?.title),
    toCsvCell(app.job?.company),
    toCsvCell(app.job?.location),
    toCsvCell(app.status),
    toCsvCell(app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'),
    toCsvCell(app.student?.program),
    toCsvCell(app.student?.department),
    toCsvCell(app.student?.major),
    toCsvCell(app.student?.university),
    toCsvCell(app.student?.enrollment_number),
    toCsvCell(app.student?.gpa),
    toCsvCell(app.student?.graduation_year),
  ].join(','))

  return [headers.map(toCsvCell).join(','), ...rows].join('\n')
}

export async function generateApplicationsReportFile(recruiterId: string, days = 30): Promise<GeneratedReportFile | null> {
  const csv = await generateApplicationsCSV(recruiterId, days)

  const dateTag = new Date().toISOString().split('T')[0]
  return {
    fileName: `applications-report-${dateTag}.csv`,
    mimeType: 'text/csv',
    contentBase64: toBase64FromText(csv),
    reportType: 'applications',
    format: 'csv',
    dateRange: days,
  }
}

export async function getCandidatePipelineReportData(recruiterId: string, days: number) {
  return getApplicationsReportData(recruiterId, days)
}

export async function generateCandidatesReportFile(
  recruiterId: string,
  days: number,
  format: 'csv' | 'excel'
): Promise<GeneratedReportFile | null> {
  const data = await getCandidatePipelineReportData(recruiterId, days)
  const rows = (data || []).map((d: any) => ({
    'Application ID': d.id,
    'Job Title': d.job?.title || 'N/A',
    Company: d.job?.company || 'N/A',
    Location: d.job?.location || 'N/A',
    'Candidate Name': d.profile?.full_name || 'N/A',
    'Candidate Email': d.profile?.email || 'N/A',
    'Candidate Phone': d.profile?.phone || 'N/A',
    Program: d.student?.program || 'N/A',
    Department: d.student?.department || 'N/A',
    Major: d.student?.major || 'N/A',
    'Graduation Year': d.student?.graduation_year || 'N/A',
    Status: d.status || 'N/A',
    'Applied Date': d.applied_at ? new Date(d.applied_at).toLocaleDateString() : 'N/A',
  }))

  const columns = [
    'Application ID',
    'Job Title',
    'Company',
    'Location',
    'Candidate Name',
    'Candidate Email',
    'Candidate Phone',
    'Program',
    'Department',
    'Major',
    'Graduation Year',
    'Status',
    'Applied Date',
  ]

  const worksheet = rows.length > 0
    ? xlsx.utils.json_to_sheet(rows)
    : xlsx.utils.aoa_to_sheet([columns])
  const dateTag = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    const csv = xlsx.utils.sheet_to_csv(worksheet)
    return {
      fileName: `candidates-report-${dateTag}.csv`,
      mimeType: 'text/csv',
      contentBase64: toBase64FromText(csv),
      reportType: 'candidates',
      format: 'csv',
      dateRange: days,
    }
  }

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Candidates')
  const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer

  return {
    fileName: `candidates-report-${dateTag}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentBase64: toBase64FromBuffer(excelBuffer),
    reportType: 'candidates',
    format: 'excel',
    dateRange: days,
  }
}

export async function getInterviewAnalyticsReportData(recruiterId: string, days: number) {
  noStore()
  const supabase = await createClient()
  const rangeDays = normalizeRangeDays(days)
  const dateLimitIso = getDateLimitIso(rangeDays)

  const jobIds = await getRecruiterScopedJobIds(recruiterId)
  if (jobIds.length === 0) {
    return []
  }

  let interviewsQuery = supabase
    .from('interviews')
    .select(`
      id, status, type, location, scheduled_at, duration_min,
      job:jobs!inner(title, company),
      student:profiles!interviews_student_id_fkey(full_name, email)
    `)
    .in('job_id', jobIds)
    .order('scheduled_at', { ascending: false })

  if (dateLimitIso) {
    interviewsQuery = interviewsQuery.gte('scheduled_at', dateLimitIso)
  }

  const { data, error } = await interviewsQuery

  if (error || !data) {
    console.error('Error fetching interview analytics:', error)
    return []
  }
  return data
}

export async function generateInterviewsPDFReportFile(
  recruiterId: string,
  days: number
): Promise<GeneratedReportFile | null> {
  const data = await getInterviewAnalyticsReportData(recruiterId, days)

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Interview Analytics Report', 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date().toLocaleDateString()} for the last ${days} days`, 14, 30)

  if (!data || data.length === 0) {
    doc.setTextColor(70)
    doc.text('No interview records found for the selected period.', 14, 44)
  } else {
    const tableData = data.map((d: any) => [
      d.student?.full_name || 'N/A',
      d.job?.title || 'N/A',
      d.scheduled_at ? new Date(d.scheduled_at).toLocaleDateString() : 'N/A',
      d.type || 'N/A',
      d.status || 'N/A',
      `${d.duration_min || 0} min`,
    ])

    autoTable(doc, {
      startY: 40,
      head: [['Candidate', 'Job', 'Date', 'Type', 'Status', 'Duration']],
      body: tableData,
    })
  }

  const pdfBuffer = doc.output('arraybuffer')
  const dateTag = new Date().toISOString().split('T')[0]

  return {
    fileName: `interviews-report-${dateTag}.pdf`,
    mimeType: 'application/pdf',
    contentBase64: toBase64FromBuffer(pdfBuffer),
    reportType: 'interviews',
    format: 'pdf',
    dateRange: days,
  }
}

export async function getPerformanceMetricsData(recruiterId: string, days: number) {
  noStore()
  const supabase = await createClient()
  const rangeDays = normalizeRangeDays(days)
  const dateLimitIso = getDateLimitIso(rangeDays)

  const jobIds = await getRecruiterScopedJobIds(recruiterId)

  const scopedJobsCount = jobIds.length
  if (scopedJobsCount === 0) {
    return {
      period_days: days,
      scoped_jobs_total: 0,
      new_jobs_posted: 0,
      applications_received: 0,
      interviews_scheduled: 0,
      generated_at: new Date().toISOString(),
    }
  }

  let jobsCountQuery = supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .in('id', jobIds)

  let appsCountQuery = supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .in('job_id', jobIds)

  let interviewsCountQuery = supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true })
    .in('job_id', jobIds)

  if (dateLimitIso) {
    jobsCountQuery = jobsCountQuery.gte('created_at', dateLimitIso)
    appsCountQuery = appsCountQuery.gte('applied_at', dateLimitIso)
    interviewsCountQuery = interviewsCountQuery.gte('scheduled_at', dateLimitIso)
  }

  const [{ count: jobsCount }, { count: appsCount }, { count: interviewsCount }] = await Promise.all([
    jobsCountQuery,
    appsCountQuery,
    interviewsCountQuery,
  ])

  return {
    period_days: rangeDays,
    scoped_jobs_total: scopedJobsCount,
    new_jobs_posted: jobsCount || 0,
    applications_received: appsCount || 0,
    interviews_scheduled: interviewsCount || 0,
    generated_at: new Date().toISOString(),
  }
}

export async function generatePerformancePDFReportFile(
  recruiterId: string,
  days: number
): Promise<GeneratedReportFile | null> {
  const data = await getPerformanceMetricsData(recruiterId, days)

  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Recruitment Performance Metrics', 14, 22)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date(data.generated_at).toLocaleDateString()} for the last ${days} days`, 14, 30)

  doc.setDrawColor(200)
  doc.setFillColor(245, 247, 250)

  doc.rect(14, 40, 85, 30, 'FD')
  doc.setTextColor(50)
  doc.setFontSize(10)
  doc.text('New Jobs Posted', 20, 50)
  doc.setFontSize(22)
  doc.setTextColor(10)
  doc.text(data.new_jobs_posted.toString(), 20, 63)

  doc.rect(105, 40, 85, 30, 'FD')
  doc.setTextColor(50)
  doc.setFontSize(10)
  doc.text('Applications Received', 110, 50)
  doc.setFontSize(22)
  doc.setTextColor(10)
  doc.text(data.applications_received.toString(), 110, 63)

  doc.rect(14, 75, 85, 30, 'FD')
  doc.setTextColor(50)
  doc.setFontSize(10)
  doc.text('Interviews Scheduled', 20, 85)
  doc.setFontSize(22)
  doc.setTextColor(10)
  doc.text(data.interviews_scheduled.toString(), 20, 98)

  doc.rect(105, 75, 85, 30, 'FD')
  doc.setTextColor(50)
  doc.setFontSize(10)
  doc.text('Jobs In Scope', 110, 85)
  doc.setFontSize(22)
  doc.setTextColor(10)
  doc.text(data.scoped_jobs_total.toString(), 110, 98)

  const pdfBuffer = doc.output('arraybuffer')
  const dateTag = new Date().toISOString().split('T')[0]

  return {
    fileName: `performance-report-${dateTag}.pdf`,
    mimeType: 'application/pdf',
    contentBase64: toBase64FromBuffer(pdfBuffer),
    reportType: 'performance',
    format: 'pdf',
    dateRange: days,
  }
}

export async function logGeneratedReport(recruiterId: string, reportType: string, format: string, fileName: string, dateRange: number) {
  const supabase = await createClient()
  
  // Try inserting into generated_reports table. We use a try catch in case the DB table isn't created yet manually.
  try {
    const { error } = await supabase
      .from('generated_reports')
      .insert({
        recruiter_id: recruiterId,
        report_type: reportType,
        format,
        file_name: fileName,
        date_range: dateRange
      })
      
    if (error && error.code === '42P01') {
      console.warn("generated_reports table doesn't exist yet, skipping report logging.");
      return true; // We don't fail generation if the logging table doesn't exist
    }
    
    return !error;
  } catch (e) {
    console.error('Logging failed:', e);
    return false;
  }
}

export async function getReportStatusPreview(
  recruiterId: string,
  reportType: ReportType,
  days: number
): Promise<ReportStatusPreview> {
  noStore()
  const range = normalizeRangeDays(days)

  if (reportType === 'applications' || reportType === 'candidates') {
    const applications = await getApplicationsReportData(recruiterId, range)
    return {
      reportType,
      total: applications.length,
      counts: groupCountByLabel(applications.map((row) => row.status), 'No Status'),
    }
  }

  if (reportType === 'interviews') {
    const interviews = await getInterviewAnalyticsReportData(recruiterId, range)
    return {
      reportType,
      total: interviews.length,
      counts: groupCountByLabel(interviews.map((row: any) => row.status), 'No Status'),
    }
  }

  const metrics = await getPerformanceMetricsData(recruiterId, range)
  return {
    reportType,
    total: metrics.applications_received,
    counts: [
      { label: 'New Jobs Posted', count: metrics.new_jobs_posted },
      { label: 'Applications Received', count: metrics.applications_received },
      { label: 'Interviews Scheduled', count: metrics.interviews_scheduled },
    ],
  }
}

export async function getRecentReports(recruiterId: string) {
  noStore()
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      if (error.code === '42P01') return []; // Table doesn't exist yet
      console.error('Error fetching recent reports:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
}
