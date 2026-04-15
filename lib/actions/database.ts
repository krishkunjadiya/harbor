'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/cached'
import { unstable_noStore as noStore, revalidatePath } from 'next/cache'
import type {
  Profile,
  Student,
  University,
  Recruiter,
  StudentDashboard,
  UniversityDashboard,
  RecruiterDashboard,
  Job,
  JobApplication,
  Notification
} from '@/lib/types/database'

const DASHBOARD_CACHE_TTL_MS = 20_000

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const studentDashboardCache = new Map<string, CacheEntry<StudentDashboard | null>>()
const recruiterDashboardCache = new Map<string, CacheEntry<RecruiterDashboard | null>>()
const universityDashboardCache = new Map<string, CacheEntry<UniversityDashboard | null>>()

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.value
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
  })
}

// =============================================
// USER & PROFILE QUERIES
// =============================================

export async function getUserById(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) { console.error('Error fetching user:', error); return null }
  return data as Profile
}

export async function getCurrentUserProfile() {
  // Backward-compatible wrapper: now uses request-scoped cached auth/profile lookup
  // so existing imports across app pages automatically benefit from deduplication.
  return await getCurrentProfile()
}

export async function getStudentProfileEditBootstrap() {
  const profile = await getCurrentProfile()

  if (!profile || profile.user_type !== 'student') {
    return null
  }

  const [studentData, skills] = await Promise.all([
    getStudentProfile(profile.id),
    getUserSkills(profile.id),
  ])

  return {
    profile,
    student: studentData?.students || null,
    skills: skills || [],
  }
}

export async function getStudentProfile(userId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('students').select('*').eq('profile_id', userId).single(),
  ])
  return { ...profile, students: student }
}

export async function getUniversityProfile(userId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: uni }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('universities').select('*').eq('id', userId).single(),
  ])
  return { ...profile, universities: uni }
}

export async function getRecruiterProfile(userId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: recruiter }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('recruiters').select('*').eq('profile_id', userId).single(),
  ])
  return { ...profile, recruiters: recruiter }
}

export async function getAllUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data as Profile[]
}

// =============================================
// DASHBOARDS
// =============================================

export async function getStudentDashboard(userId: string): Promise<StudentDashboard | null> {
  const cached = readCache(studentDashboardCache, userId)
  if (cached) {
    return cached
  }

  const supabase = await createClient()

  // Run ALL independent queries in parallel — reduces latency from 5×RTT to 1×RTT
  const [
    { data: profile },
    { data: student },
    { data: credentials },
    { data: applications },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('students').select('*').eq('profile_id', userId).single(),
    supabase.from('credentials').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('job_applications').select('*, job:jobs(*)').eq('student_id', userId).order('applied_at', { ascending: false }).limit(10),
  ])
const dashboard: StudentDashboard = {
  profile: { ...profile, ...student },
  credentials: credentials || [],
  applications: applications || [],
  stats: {
    total_credentials: credentials?.length || 0,
    applications_count: applications?.length || 0,
    profile_views: 0,
  }
}


  writeCache(studentDashboardCache, userId, dashboard)
  return dashboard
}

export async function getRecruiterDashboard(userId: string): Promise<RecruiterDashboard | null> {
  const cached = readCache(recruiterDashboardCache, userId)
  if (cached) {
    return cached
  }

  const supabase = await createClient()

  // Batch 1: profile + recruiter in parallel
  const [{ data: profile }, { data: recruiter }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('recruiters').select('*').eq('profile_id', userId).single(),
  ])

  if (!recruiter) {
    const emptyDashboard: RecruiterDashboard = {
      profile: profile || {},
      stats: { active_jobs: 0, total_applications: 0, shortlisted: 0, hired: 0 },
      jobs: [],
      recent_applications: [],
    }

    writeCache(recruiterDashboardCache, userId, emptyDashboard)
    return emptyDashboard
  }

  // Query all jobs for the same company so every recruiter sees all company postings
  const companyName = recruiter.company_name || recruiter.company
  const jobsQuery = companyName
    ? supabase.from('jobs').select('*').eq('company', companyName)
    : supabase.from('jobs').select('*').eq('recruiter_id', userId)

  const activeJobsCountQuery = companyName
    ? supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company', companyName).eq('status', 'active')
    : supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('recruiter_id', userId).eq('status', 'active')

  // Batch 2: jobs + active count in parallel
  const [{ data: jobs }, { count: activeJobsCount }] = await Promise.all([
    jobsQuery.order('created_at', { ascending: false }),
    activeJobsCountQuery,
  ])

  // Use the job UUID (id column) to match job_applications.job_id
  const jobIds = jobs?.map(j => j.id) || []
  let recent_applications: any[] = []

  if (jobIds.length > 0) {
    const { data: apps, error: appError } = await supabase
      .from('job_applications')
      .select(`*`)
      .in('job_id', jobIds)
      .order('applied_at', { ascending: false })
      .limit(10)

    if (appError) {
      console.error("Error fetching recent applications:", appError);
    } else if (apps) {
      const studentProfileIds = [...new Set(apps.map(app => app.student_id).filter(Boolean))];
      let studentsMap = new Map();

      if (studentProfileIds.length > 0) {
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select(`profile_id, major, program, profiles(full_name, email)`)
          .in('profile_id', studentProfileIds);

        if (students) {
          for (const student of students) {
            studentsMap.set(student.profile_id, student);
          }
        }
      }

      // Manually join and flatten data for the frontend
      recent_applications = apps.map(app => {
        const studentData = studentsMap.get(app.student_id);
        return {
          ...app,
          student: {
            ...studentData,
            ...studentData?.profiles // Flatten profiles data
          },
          job: jobs?.find(j => j.id === app.job_id) || {}
        }
      });
    }
  }

  // Batch 3: Count queries in parallel instead of sequentially
  let totalApplications = 0
  let shortlistedCount = 0
  let acceptedCount = 0

  if (jobIds.length > 0) {
    const [totalRes, shortlistedRes, acceptedRes] = await Promise.all([
      supabase.from('job_applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds),
      supabase.from('job_applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'shortlisted'),
      supabase.from('job_applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'accepted'),
    ])
    totalApplications = totalRes.count || 0
    shortlistedCount = shortlistedRes.count || 0
    acceptedCount = acceptedRes.count || 0
  }

  const dashboard: RecruiterDashboard = {
    profile: { ...profile, ...recruiter },
    stats: {
      active_jobs: activeJobsCount || 0,
      total_applications: totalApplications,
      shortlisted: shortlistedCount,
      hired: acceptedCount,
    },

    jobs: jobs || [],
    recent_applications: recent_applications,
  }

  writeCache(recruiterDashboardCache, userId, dashboard)
  return dashboard
}

export async function getUniversityDashboard(userId: string): Promise<UniversityDashboard | null> {
  const cached = readCache(universityDashboardCache, userId)
  if (cached) {
    return cached
  }

  const supabase = await createClient()

  // First batch: profile + university (needed for student count query)
  const [{ data: profile }, { data: uni }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('universities').select('*').eq('id', userId).single(),
  ])

  // Second batch: all count queries in parallel
  const [
    { count: studentCount },
    { count: facultyCount },
    { count: deptCount },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('university', uni?.university_name || ''),
    supabase.from('faculty').select('*', { count: 'exact', head: true }).eq('university_id', userId),
    supabase.from('departments').select('*', { count: 'exact', head: true }).eq('university_id', userId),
  ])

  const dashboard: UniversityDashboard = {
    profile: { ...profile, ...uni },
    stats: {
      total_students: studentCount || 0,
      total_faculty: facultyCount || 0,
      total_departments: deptCount || 0,
      credentials_issued: 0,
      active_recruiters: 0,
    },
    recent_credentials: []
  }

  writeCache(universityDashboardCache, userId, dashboard)
  return dashboard
}

// =============================================
// JOBS
// =============================================

export async function getActiveJobs(limit = 100) {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(limit)
  return data as Job[] || []
}

export async function getRecruiterJobs(recruiterId: string) {
  const supabase = await createClient()

  // Look up the recruiter's company so all company jobs are returned, not just their own
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('company_name, company')
    .eq('profile_id', recruiterId)
    .single()

  const companyName = recruiter?.company_name || recruiter?.company

  const query = companyName
    ? supabase.from('jobs').select('*, applications:job_applications(count)').eq('company', companyName)
    : supabase.from('jobs').select('*, applications:job_applications(count)').eq('recruiter_id', recruiterId)

  const { data: jobs } = await query.order('created_at', { ascending: false })

  // Enhance jobs with required client-side fields
  return jobs?.map(job => ({
    ...job,
    new_applicants: job.applications?.[0]?.count || 0,
  })) || []
}

export async function getJobById(jobId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (error) return null
  return data as Job
}

export async function getJobApplications(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('job_applications').select('*, job:jobs(*)').eq('student_id', studentId).order('applied_at', { ascending: false })
  return data || []
}

interface RecruiterApplicationsQuery {
  status?: string
  jobId?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

export async function getAllApplicationsForRecruiter(
  recruiterId: string,
  queryOptions: RecruiterApplicationsQuery = {}
) {
  const supabase = await createClient()

  const page = Math.max(1, queryOptions.page || 1)
  const pageSize = Math.min(100, Math.max(1, queryOptions.pageSize || 20))

  // Resolve recruiter context with flexible lookup (`profile_id` is canonical,
  // `id` fallback supports legacy records).
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id, profile_id, company_name, company')
    .or(`profile_id.eq.${recruiterId},id.eq.${recruiterId}`)
    .maybeSingle()

  const recruiterProfileId = recruiter?.profile_id || recruiterId
  const companyName = recruiter?.company_name || recruiter?.company || null

  const jobsQuery = companyName
    ? supabase
        .from('jobs')
        .select('id, title, company, location, recruiter_id')
        .or(`recruiter_id.eq.${recruiterProfileId},company.eq.${companyName}`)
    : supabase
        .from('jobs')
        .select('id, title, company, location, recruiter_id')
        .eq('recruiter_id', recruiterProfileId)

  const { data: jobs, error: jobsError } = await jobsQuery

  if (jobsError) {
    console.error('Error fetching recruiter jobs:', jobsError)
    return {
      applications: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
      jobs: [],
    }
  }

  const jobList = jobs || []
  const jobIds = jobList.map((job: any) => job.id)
  if (jobIds.length === 0) {
    return {
      applications: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
      jobs: jobList,
    }
  }

  const jobsMap = new Map(jobList.map((job: any) => [job.id, job]))

  let applicationsQuery = supabase
    .from('job_applications')
    .select('id, status, applied_at, student_id, job_id, cover_letter', { count: 'exact' })
    .in('job_id', jobIds)

  if (queryOptions.status) {
    applicationsQuery = applicationsQuery.eq('status', queryOptions.status)
  }

  if (queryOptions.jobId) {
    applicationsQuery = applicationsQuery.eq('job_id', queryOptions.jobId)
  }

  if (queryOptions.fromDate) {
    applicationsQuery = applicationsQuery.gte('applied_at', `${queryOptions.fromDate}T00:00:00.000Z`)
  }

  if (queryOptions.toDate) {
    applicationsQuery = applicationsQuery.lte('applied_at', `${queryOptions.toDate}T23:59:59.999Z`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: applications, error: applicationsError, count: totalCountRaw } = await applicationsQuery
    .order('applied_at', { ascending: false })
    .range(from, to)

  if (applicationsError) {
    console.error('Error fetching recruiter applications:', applicationsError)
    return {
      applications: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
      jobs: jobList,
    }
  }

  const appList = applications || []
  const totalCount = totalCountRaw || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  if (appList.length === 0) {
    return {
      applications: [],
      totalCount,
      page,
      pageSize,
      totalPages,
      jobs: jobList,
    }
  }

  const studentProfileIds = Array.from(new Set(appList.map((app: any) => app.student_id).filter(Boolean)))

  let studentsMap = new Map<any, any>()
  if (studentProfileIds.length > 0) {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        profile_id,
        university,
        major,
        program,
        department,
        enrollment_number,
        graduation_year,
        gpa,
        resume_score,
        profiles(id, full_name, email, phone, avatar_url)
      `)
      .in('profile_id', studentProfileIds)

    if (studentsError) {
      console.error('Error fetching application students:', studentsError)
    } else {
      for (const student of students || []) {
        studentsMap.set(student.profile_id, student)
      }
    }
  }

  return {
    applications: appList.map((application: any) => ({
      ...application,
      job: jobsMap.get(application.job_id) || null,
      student: studentsMap.get(application.student_id) || null,
    })),
    totalCount,
    page,
    pageSize,
    totalPages,
    jobs: jobList,
  }
}

// =============================================
// SKILLS
// =============================================

export async function searchTaxonomySkills(searchTerm: string) {
  const supabase = await createClient()
  const normalizedSearch = searchTerm.trim().replace(/,/g, ' ')

  if (!normalizedSearch) {
    return []
  }

  const { data } = await supabase
    .from('skills_taxonomy')
    .select('*')
    .or(`title.ilike.%${normalizedSearch}%,example.ilike.%${normalizedSearch}%,commodity_title.ilike.%${normalizedSearch}%`)
    .limit(50)
  return data || []
}

export async function getStudentTaxonomySkills(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('student_taxonomy_skills')
    .select('*, skills_taxonomy(*)')
    .eq('student_id', userId)
    .order('proficiency_level', { ascending: false })
  return data || []
}

export async function addTaxonomySkill(studentId: string, onetSocCode: string, level: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('student_taxonomy_skills')
    .upsert({
      student_id: studentId,
      onet_soc_code: onetSocCode,
      proficiency_level: level
    }, { onConflict: 'student_id, onet_soc_code' })
    .select()
    .single()

  if (error) {
    console.error("Error adding taxonomy skill:", error);
    return null;
  }

  return data
}

export async function removeTaxonomySkill(studentId: string, onetSocCode: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('student_taxonomy_skills')
    .delete()
    .match({ student_id: studentId, onet_soc_code: onetSocCode })
  return !error
}

// =============================================
// UNIVERSITY MANAGEMENT
// =============================================

export async function getDepartments(universityId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('departments').select('*').eq('university_id', universityId).order('name')
  return data || []
}

export async function createDepartment(dept: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('departments').insert([dept]).select().single()
  return data
}

export async function updateDepartment(id: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('departments').update(updates).eq('id', id).select().single()
  return data
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('departments').delete().eq('id', id)
  return !error
}

export async function getFaculty(universityId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('faculty').select('*').eq('university_id', universityId).order('name')
  return data || []
}

export async function getAdminStaff(universityId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('admin_staff').select('*').eq('university_id', universityId).order('name')
  return data || []
}

export async function getCoursesByUniversity(universityId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('university_id', universityId)
  return data || []
}

export async function getUniversityStudentDashboardData(universityAdminId: string) {
  const supabase = await createClient()

  const { data: university } = await supabase
    .from('universities')
    .select('university_name')
    .eq('id', universityAdminId)
    .single()

  if (!university?.university_name) {
    return {
      totalStudents: 0,
      activeEnrollments: 0,
      averagePerformance: 0,
      recentEnrollments: [],
      topPerformers: [],
      departmentBreakdown: [],
      departmentCards: [],
      gpaDistribution: [],
      enrollmentTrends: [],
      graduationRates: [],
      semesterPerformance: [],
    }
  }

  const { data: students } = await supabase
    .from('students')
    .select('profile_id, enrollment_number, major, program, department, gpa, graduation_year, created_at, profiles(full_name, email)')
    .eq('university', university.university_name)
    .order('created_at', { ascending: false })

  const studentRows = students || []
  const studentIds = studentRows
    .map((s: any) => s.profile_id)
    .filter(Boolean)

  let enrollments: any[] = []

  if (studentIds.length > 0) {
    const enrollmentsRes = await supabase
      .from('course_enrollments')
      .select('student_id, created_at')
      .in('student_id', studentIds)

    enrollments = enrollmentsRes.data || []
  }

  const nowYear = new Date().getFullYear()
  const departmentMap = new Map<string, { year1: number; year2: number; year3: number; year4: number; total: number; gpaSum: number; gpaCount: number; graduatedCount: number }>()

  for (const student of studentRows) {
    const dept = student.department || student.major || student.program || 'Undeclared'
    const current = departmentMap.get(dept) || {
      year1: 0,
      year2: 0,
      year3: 0,
      year4: 0,
      total: 0,
      gpaSum: 0,
      gpaCount: 0,
      graduatedCount: 0,
    }

    current.total += 1

    const rawGradYear = Number(student.graduation_year)
    const yearLevel = Number.isFinite(rawGradYear)
      ? Math.max(1, Math.min(4, rawGradYear - nowYear + 1))
      : 4
    if (yearLevel === 1) current.year1 += 1
    if (yearLevel === 2) current.year2 += 1
    if (yearLevel === 3) current.year3 += 1
    if (yearLevel === 4) current.year4 += 1

    const gpa = Number(student.gpa)
    if (Number.isFinite(gpa)) {
      current.gpaSum += gpa
      current.gpaCount += 1
      if (rawGradYear <= nowYear && gpa >= 2.0) {
        current.graduatedCount += 1
      }
    }

    departmentMap.set(dept, current)
  }

  const gpaValues = studentRows
    .map((s: any) => Number(s.gpa))
    .filter((g: number) => Number.isFinite(g))

  const averageGpa = gpaValues.length > 0
    ? gpaValues.reduce((sum: number, g: number) => sum + g, 0) / gpaValues.length
    : 0

  const averagePerformance = Math.round(Math.max(0, Math.min(100, (averageGpa / 4) * 100)))

  const gpaDistributionBins = [
    { range: '3.75 - 4.00 (A)', min: 3.75, max: 4.0 },
    { range: '3.50 - 3.74 (A-)', min: 3.5, max: 3.7499 },
    { range: '3.25 - 3.49 (B+)', min: 3.25, max: 3.4999 },
    { range: '3.00 - 3.24 (B)', min: 3.0, max: 3.2499 },
    { range: 'Below 3.00', min: -Infinity, max: 2.9999 },
  ]

  const totalStudents = studentRows.length
  const gpaDistribution = gpaDistributionBins.map((bin) => {
    const count = gpaValues.filter((g: number) => g >= bin.min && g <= bin.max).length
    return {
      range: bin.range,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }
  })

  const enrollmentTrendMap = new Map<number, number>()
  for (const student of studentRows) {
    if (!student.created_at) continue
    const year = new Date(student.created_at).getFullYear()
    enrollmentTrendMap.set(year, (enrollmentTrendMap.get(year) || 0) + 1)
  }

  const enrollmentTrends = Array.from(enrollmentTrendMap.entries())
    .sort((a, b) => b[0] - a[0])
    .slice(0, 5)
    .map(([year, count], index, arr) => {
      const prev = arr[index + 1]?.[1]
      const change = prev && prev > 0 ? (((count - prev) / prev) * 100).toFixed(1) : null
      return {
        year: `${year}`,
        count,
        change: change ? `${Number(change) >= 0 ? '+' : ''}${change}%` : 'N/A',
      }
    })

  const departmentBreakdown = Array.from(departmentMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([dept, data]) => ({ dept, ...data }))

  const departmentCards = departmentBreakdown.slice(0, 8).map((item) => ({
    name: item.dept,
    students: item.total,
    avgGpa: item.gpaCount > 0 ? Number((item.gpaSum / item.gpaCount).toFixed(2)) : 0,
    retention: item.total > 0 ? Math.round(((item.year2 + item.year3 + item.year4) / item.total) * 100) : 0,
  }))

  const graduationRates = departmentBreakdown.slice(0, 8).map((item) => ({
    dept: item.dept,
    rate: item.total > 0 ? Math.round((item.graduatedCount / item.total) * 100) : 0,
  }))

  const semesterPerformance = enrollmentTrends.slice(0, 5).map((trend, index, arr) => {
    const currentAvg = averageGpa || 0
    const syntheticVariance = Math.max(0, currentAvg - index * 0.03)
    const next = arr[index + 1]
    return {
      semester: trend.year,
      gpa: Number(syntheticVariance.toFixed(2)),
      trend: next && trend.count >= next.count ? 'up' : 'down',
    }
  })

  const recentEnrollments = studentRows.slice(0, 5).map((student: any) => ({
    name: student.profiles?.full_name || 'Student',
    id: student.enrollment_number || student.profile_id,
    department: student.department || student.major || student.program || 'Undeclared',
    date: student.created_at,
  }))

  const topPerformers = [...studentRows]
    .filter((s: any) => Number.isFinite(Number(s.gpa)))
    .sort((a: any, b: any) => Number(b.gpa) - Number(a.gpa))
    .slice(0, 5)
    .map((student: any) => ({
      name: student.profiles?.full_name || 'Student',
      gpa: Number(Number(student.gpa).toFixed(2)),
      department: student.department || student.major || student.program || 'Undeclared',
    }))

  return {
    totalStudents,
    activeEnrollments: enrollments.length,
    averagePerformance,
    recentEnrollments,
    topPerformers,
    departmentBreakdown,
    departmentCards,
    gpaDistribution,
    enrollmentTrends,
    graduationRates,
    semesterPerformance,
  }
}

export async function getUniversityStudentProjects(universityAdminId: string) {
  const supabase = await createClient()

  const { data: university } = await supabase
    .from('universities')
    .select('university_name')
    .eq('id', universityAdminId)
    .single()

  if (!university?.university_name) {
    return []
  }

  const { data: students } = await supabase
    .from('students')
    .select('profile_id, major, department, profiles(full_name, email)')
    .eq('university', university.university_name)

  const studentIds = (students || []).map((s: any) => s.profile_id).filter(Boolean)
  if (studentIds.length === 0) {
    return []
  }

  const studentById = new Map<string, any>()
  for (const student of students || []) {
    studentById.set(student.profile_id, student)
  }

  const { data: projects } = await supabase
    .from('student_projects')
    .select('*')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false })

  return (projects || []).map((project: any) => {
    const student = studentById.get(project.student_id)
    return {
      ...project,
      student_name: student?.profiles?.full_name || project.student_name || 'Student',
      student_email: student?.profiles?.email || null,
      student_department: student?.department || student?.major || null,
    }
  })
}

// =============================================
// FACULTY SPECIFIC
// =============================================

export async function getCoursesByFaculty(facultyId: string) {
  const supabase = await createClient()
  // First get faculty record
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', facultyId).single()
  if (!fac) {
    const { data: fallbackCourses } = await supabase.from('courses').select('*').eq('faculty_id', facultyId)
    return fallbackCourses || []
  }

  const { data: instructorCourses } = await supabase.from('courses').select('*').eq('instructor_id', fac.id)
  if (instructorCourses && instructorCourses.length > 0) {
    return instructorCourses
  }

  const { data: facultyCourses } = await supabase.from('courses').select('*').eq('faculty_id', facultyId)
  return facultyCourses || []
}

export async function getCourseEnrollmentsByFaculty(facultyId: string) {
  const supabase = await createClient()
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', facultyId).single()

  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id').eq('faculty_id', facultyId)
    courses = data || []
  }

  const courseIds = courses?.map(c => c.id) || []
  if (courseIds.length === 0) return []

  const { data } = await supabase
    .from('course_enrollments')
    .select('*, student:profiles!course_enrollments_student_id_fkey(id, full_name, email, avatar_url), course:courses(*)')
    .in('course_id', courseIds)

  const enrollments = data || []
  const studentIds = [...new Set(enrollments.map((e: any) => e.student_id).filter(Boolean))]
  if (studentIds.length === 0) return enrollments

  const { data: studentDetails } = await supabase
    .from('students')
    .select('profile_id, enrollment_number')
    .in('profile_id', studentIds)

  const enrollmentNumberByProfileId = new Map<string, string>()
  for (const item of studentDetails || []) {
    if (item?.profile_id && item?.enrollment_number) {
      enrollmentNumberByProfileId.set(item.profile_id, item.enrollment_number)
    }
  }

  return enrollments.map((e: any) => ({
    ...e,
    student_enrollment_number: enrollmentNumberByProfileId.get(e.student_id) || null,
  }))
}

export async function getProjectsByFaculty(facultyId: string) {
  const supabase = await createClient()
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', facultyId).single()

  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id').eq('faculty_id', facultyId)
    courses = data || []
  }

  const courseIds = courses?.map(c => c.id) || []

  let courseProjects: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('student_projects')
      .select('*')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
    courseProjects = data || []
  }

  const byId = new Map<string, any>()
  for (const p of courseProjects || []) {
    if (p?.id) byId.set(p.id, p)
  }

  // Optional schema fallback: supervisor_id links directly to faculty profile_id.
  const { data: supervised, error: supervisedError } = await supabase
    .from('student_projects')
    .select('*')
    .eq('supervisor_id', facultyId)
    .order('created_at', { ascending: false })

  if (!supervisedError) {
    for (const p of supervised || []) {
      if (p?.id) byId.set(p.id, p)
    }
  }

  return Array.from(byId.values())
}

// =============================================
// STUDENT ACADEMIC
// =============================================

export async function getStudentCourses(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('course_enrollments').select('*, course:courses(*)').eq('student_id', studentId)
  return data || []
}

export async function getAcademicRecords(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('academic_records').select('*, course:courses(*)').eq('student_id', studentId)
  return data || []
}

export async function getStudentTranscript(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('transcripts').select('*').eq('student_id', studentId).single()
  return data
}

export async function getStudentProjects(studentId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('student_projects').select('*').eq('student_id', studentId)
  return data || []
}

export async function getPublicProjects() {
  const supabase = await createClient()
  const { data } = await supabase.from('student_projects').select('*, student:profiles(*)').eq('visibility', 'public').limit(20)
  return data || []
}

export async function getUserCredentials(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('credentials').select('*').eq('user_id', userId)
  return data || []
}

// =============================================
// UPDATES
// =============================================

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
  return data
}

export async function updateStudentProfile(userId: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('students').update(updates).eq('profile_id', userId).select().single()
  return data
}

// =============================================
// USER SKILLS
// =============================================

export async function getUserSkills(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createUserSkill(userId: string, skillName: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_skills')
    .insert([{
      user_id: userId,
      skill_name: skillName,
      skill_category: 'General',
      proficiency_level: 'Intermediate',
      created_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating user skill:', error)
    return null
  }
  return data
}

export async function deleteUserSkill(skillId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('id', skillId)
  
  return !error
}

// =============================================
// NOTIFICATIONS
// =============================================

export async function getUserNotifications(userId: string, unreadOnly = false) {
  const supabase = await createClient()
  let query = supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (unreadOnly) query = query.eq('read', false)
  const { data } = await query.limit(20)
  return data as Notification[] || []
}

export async function getUnreadNotificationsCount(userId: string) {
  const supabase = await createClient()
  const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false)
  return count || 0
}

// =============================================
// SEARCH
// =============================================

function normalizeSearchText(value: unknown): string {
  if (value == null) return ''
  return String(value).toLowerCase().trim()
}

function tokenizeSearchTerm(searchTerm: string): string[] {
  const cleaned = normalizeSearchText(searchTerm).replace(/[^a-z0-9@._+-]+/g, ' ')
  return cleaned.split(/\s+/).map((token) => token.trim()).filter(Boolean)
}

function buildStudentSearchFields(student: any) {
  const profile = student?.profiles || {}
  const skillsText = Array.isArray(student?.skills)
    ? student.skills.join(' ')
    : student?.skills
      ? String(student.skills)
      : ''

  const name = normalizeSearchText(profile.full_name)
  const email = normalizeSearchText(profile.email)
  const major = normalizeSearchText(student?.major)
  const program = normalizeSearchText(student?.program)
  const university = normalizeSearchText(student?.university)
  const bio = normalizeSearchText(student?.bio)
  const skills = normalizeSearchText(skillsText)
  const graduationYear = normalizeSearchText(student?.graduation_year)
  const gpa = normalizeSearchText(student?.gpa)
  const resumeScore = normalizeSearchText(student?.resume_score)

  const combined = [
    name,
    email,
    major,
    program,
    university,
    bio,
    skills,
    graduationYear,
    gpa,
    resumeScore,
  ].filter(Boolean).join(' ')

  return {
    name,
    email,
    major,
    program,
    university,
    bio,
    skills,
    graduationYear,
    gpa,
    resumeScore,
    combined,
  }
}

function scoreStudentSearchMatch(fields: ReturnType<typeof buildStudentSearchFields>, normalizedTerm: string, tokens: string[]): number {
  if (!fields.combined || tokens.length === 0) return 0

  let score = 0
  let matchedTokens = 0

  if (normalizedTerm && fields.combined.includes(normalizedTerm)) {
    score += 6
  }

  for (const token of tokens) {
    let tokenScore = 0

    if (fields.name.startsWith(token)) tokenScore = Math.max(tokenScore, 5)
    if (fields.name.includes(token)) tokenScore = Math.max(tokenScore, 4)
    if (fields.skills.includes(token)) tokenScore = Math.max(tokenScore, 4)
    if (fields.major.includes(token) || fields.program.includes(token)) tokenScore = Math.max(tokenScore, 4)
    if (fields.university.includes(token)) tokenScore = Math.max(tokenScore, 3)
    if (fields.email.includes(token)) tokenScore = Math.max(tokenScore, 3)
    if (fields.bio.includes(token)) tokenScore = Math.max(tokenScore, 2)
    if (fields.graduationYear.includes(token) || fields.gpa.includes(token) || fields.resumeScore.includes(token)) {
      tokenScore = Math.max(tokenScore, 2)
    }
    if (tokenScore === 0 && fields.combined.includes(token)) tokenScore = 1

    if (tokenScore > 0) {
      matchedTokens += 1
      score += tokenScore
    }
  }

  const minMatchedTokens = Math.max(1, Math.ceil(tokens.length * 0.6))
  if (matchedTokens < minMatchedTokens) {
    return 0
  }

  return score
}

export async function searchStudents(searchTerm?: string, limit = 50) {
  const supabase = await createClient()
  const normalizedTerm = (searchTerm || '').trim()
  const safeLimit = Math.min(Math.max(limit, 1), 200)

  // Pull a wider candidate pool when searching so recruiters can discover by skills,
  // major, university, bio keywords, etc., not only by exact names.
  const poolLimit = normalizedTerm ? Math.min(Math.max(safeLimit * 4, 150), 500) : safeLimit

  let query = supabase
    .from('students')
    .select(`
      id,
      profile_id,
      university,
      major,
      program,
      graduation_year,
      gpa,
      bio,
      resume_score,
      skills,
      profiles(id, full_name, email, avatar_url)
    `)

  const { data, error } = await query
    .order('resume_score', { ascending: false, nullsFirst: false })
    .limit(poolLimit)

  if (error || !data) {
    console.error('Error searching students:', error)
    return []
  }

  const tokens = tokenizeSearchTerm(normalizedTerm)

  const students = normalizedTerm
    ? (data || [])
        .map((student: any) => {
          const fields = buildStudentSearchFields(student)
          const relevance = scoreStudentSearchMatch(fields, normalizeSearchText(normalizedTerm), tokens)
          return { student, relevance }
        })
        .filter((entry) => entry.relevance > 0)
        .sort((a, b) => {
          if (b.relevance !== a.relevance) return b.relevance - a.relevance
          const aResume = Number(a.student?.resume_score || 0)
          const bResume = Number(b.student?.resume_score || 0)
          return bResume - aResume
        })
        .slice(0, safeLimit)
        .map((entry) => entry.student)
    : (data || []).slice(0, safeLimit)

  const profileIds = students
    .map((student: any) => student.profile_id)
    .filter(Boolean)

  if (profileIds.length === 0) {
    return students.map((student: any) => ({
      ...student,
      projects_count: 0,
      certifications_count: 0,
    }))
  }

  const [projectsRes, credentialsRes] = await Promise.all([
    supabase
      .from('student_projects')
      .select('student_id')
      .in('student_id', profileIds),
    supabase
      .from('credentials')
      .select('user_id')
      .in('user_id', profileIds),
  ])

  const projectsCountMap = new Map<string, number>()
  for (const row of projectsRes.data || []) {
    if (!row.student_id) continue
    projectsCountMap.set(row.student_id, (projectsCountMap.get(row.student_id) || 0) + 1)
  }

  const credentialsCountMap = new Map<string, number>()
  for (const row of credentialsRes.data || []) {
    if (!row.user_id) continue
    credentialsCountMap.set(row.user_id, (credentialsCountMap.get(row.user_id) || 0) + 1)
  }

  return students.map((student: any) => {
    const profileId = student.profile_id
    const projectsCount = projectsCountMap.get(profileId) || 0
    const certificationsCount = credentialsCountMap.get(profileId) || 0

    return {
      ...student,
      projects_count: projectsCount,
      certifications_count: certificationsCount,
    }
  })
}

// =============================================
// ACTIVITY
// =============================================

function toActivityTitle(activityType: string) {
  return activityType
    .split('_')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export async function getUserActivities(userId: string, limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  const activities = (data || []).map((row: any) => {
    const metadata = row?.metadata || row?.activity_data || {}
    const activityType = row?.type || row?.activity_type || 'activity'
    const title = row?.title || metadata?.title || toActivityTitle(activityType)
    const description = row?.description || metadata?.description || ''

    return {
      ...row,
      type: activityType,
      title,
      description,
      read: typeof row?.read === 'boolean' ? row.read : false,
      metadata,
    }
  })

  return activities
}

// =============================================
// FACULTY DASHBOARD & ANALYTICS
// =============================================

export async function getFacultyDashboard(userId: string) {
  const supabase = await createClient()

  // Get faculty profile linked to user
  const { data: facultyProfile } = await supabase.from('faculty').select('*').eq('profile_id', userId).single()

  if (!facultyProfile) {
    // Fallback if no faculty record exists yet
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return {
      profile: { name: userProfile?.full_name || 'Faculty' },
      totalCourses: 0,
      totalStudents: 0,
      pendingReviews: 0,
      courses: [],
      recentAssignments: []
    }
  }

  // Get courses (support both instructor_id and faculty_id schemas)
  let courses: any[] = []
  const { data: instructorCourses } = await supabase.from('courses').select('*').eq('instructor_id', facultyProfile.id)
  courses = instructorCourses || []
  if (courses.length === 0) {
    const { data: facultyCourses } = await supabase.from('courses').select('*').eq('faculty_id', userId)
    courses = facultyCourses || []
  }
  const courseIds = courses?.map(c => c.id) || []

  // Enrollment counts per course for dashboard cards/lists
  const enrollmentCounts: Record<string, number> = {}
  let enrollments: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('course_enrollments')
      .select('course_id, status')
      .in('course_id', courseIds)
    enrollments = data || []
    for (const e of enrollments) {
      if (!e?.course_id) continue
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1
    }
  }

  const normalizedCourses = (courses || []).map((course: any) => {
    const enrolled = enrollmentCounts[course.id] ?? course.total_students ?? 0
    const completed = enrollments.filter((e: any) => e.course_id === course.id && e.status === 'completed').length
    const progress = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0

    return {
      ...course,
      enrolled_count: enrolled,
      progress,
    }
  })

  // Get assignments
  let recentAssignments: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase.from('assignments').select('*').in('course_id', courseIds).order('created_at', { ascending: false }).limit(5)
    recentAssignments = data || []
  }

  // Stats
  const totalCourses = normalizedCourses.length

  // Total Students
  let totalStudents = 0
  totalStudents = enrollments.length

  // Pending Reviews
  let pendingReviews = 0
  if (recentAssignments.length > 0) {
    const assignmentIds = recentAssignments.map((a: any) => a.id)
    const { count } = await supabase.from('assignment_submissions').select('*', { count: 'exact', head: true }).in('assignment_id', assignmentIds).is('grade', null)
    pendingReviews = count || 0
  }

  return {
    profile: facultyProfile,
    totalCourses,
    totalStudents,
    pendingReviews,
    courses: normalizedCourses,
    recentAssignments
  }
}

export async function getCourseGradeStatistics(userId: string) {
  const supabase = await createClient()
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', userId).single()
  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id, code, name, course_code, course_name').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id, code, name, course_code, course_name').eq('faculty_id', userId)
    courses = data || []
  }
  const courseIds = courses?.map(c => c.id) || []
  if (courseIds.length === 0) return []

  const { data: records } = await supabase
    .from('academic_records')
    .select('course_id, gpa_points, grade')
    .in('course_id', courseIds)

  const gradeToPercent: Record<string, number> = {
    'A+': 98, A: 95, 'A-': 90,
    'B+': 88, B: 84, 'B-': 80,
    'C+': 78, C: 74, 'C-': 70,
    'D+': 68, D: 64, 'D-': 60,
    F: 50,
  }

  return (courses || []).map((course: any) => {
    const courseRecords = (records || []).filter((r: any) => r.course_id === course.id)
    const values = courseRecords
      .map((r: any) => {
        if (typeof r.gpa_points === 'number') return Math.round((r.gpa_points / 4) * 100)
        const letter = String(r.grade || '').toUpperCase().trim()
        return gradeToPercent[letter]
      })
      .filter((v: number | undefined) => Number.isFinite(v)) as number[]

    const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0

    return {
      course: course.code || course.course_code || course.name || course.course_name || 'Course',
      average,
    }
  })
}

export async function getAssignmentCompletionRates(userId: string) {
  const supabase = await createClient()
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', userId).single()
  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id, code, name, course_code, course_name').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id, code, name, course_code, course_name').eq('faculty_id', userId)
    courses = data || []
  }
  const courseIds = courses?.map(c => c.id) || []
  if (courseIds.length === 0) return []

  // Run independent queries in parallel
  const [{ data: assignments }, { data: enrollments }] = await Promise.all([
    supabase.from('assignments').select('id, course_id').in('course_id', courseIds),
    supabase.from('course_enrollments').select('course_id, student_id').in('course_id', courseIds),
  ])

  const assignmentIds = (assignments || []).map((a: any) => a.id)
  let submissions: any[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase.from('assignment_submissions').select('assignment_id').in('assignment_id', assignmentIds)
    submissions = data || []
  }

  return (courses || []).map((course: any) => {
    const courseAssignments = (assignments || []).filter((a: any) => a.course_id === course.id)
    const courseEnrollmentCount = (enrollments || []).filter((e: any) => e.course_id === course.id).length
    const courseAssignmentIds = new Set(courseAssignments.map((a: any) => a.id))
    const submissionCount = submissions.filter((s: any) => courseAssignmentIds.has(s.assignment_id)).length

    const possibleSubmissions = courseEnrollmentCount * courseAssignments.length
    const rate = possibleSubmissions > 0 ? Math.round((submissionCount / possibleSubmissions) * 100) : 0

    return {
      course: course.code || course.course_code || course.name || course.course_name || 'Course',
      rate,
    }
  })
}

export async function getRecruiterTeamRecentActivity(userId: string, limit = 10) {
  const supabase = await createClient()

  const { data: currentRecruiter } = await supabase
    .from('recruiters')
    .select('company_name')
    .eq('profile_id', userId)
    .single()

  if (!currentRecruiter?.company_name) return []

  const { data: companyRecruiters } = await supabase
    .from('recruiters')
    .select('profile_id, profile:profiles!inner(full_name)')
    .eq('company_name', currentRecruiter.company_name)

  const recruiterProfileIds = (companyRecruiters || [])
    .map((r: any) => r.profile_id)
    .filter(Boolean)

  if (recruiterProfileIds.length === 0) return []

  const { data: activities } = await supabase
    .from('user_activity')
    .select('user_id, activity_type, created_at, activity_data')
    .in('user_id', recruiterProfileIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  const nameByUserId = new Map<string, string>()
  for (const recruiter of companyRecruiters || []) {
    if (!recruiter?.profile_id) continue
    const profile = Array.isArray(recruiter.profile) ? recruiter.profile[0] : recruiter.profile
    nameByUserId.set(recruiter.profile_id, profile?.full_name || 'Team member')
  }

  return (activities || []).map((activity: any) => ({
    user: nameByUserId.get(activity.user_id) || 'Team member',
    action: activity.activity_type?.replace(/_/g, ' ') || 'updated activity',
    time: activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Just now',
  }))
}

// =============================================
// SAVED CANDIDATES
// =============================================

export async function getSavedCandidates(recruiterId: string) {
  noStore()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('saved_candidates')
    .select(`
      *,
      student:profiles!saved_candidates_student_id_fkey(
        *,
        students(*),
        credentials(*),
        student_projects(*)
      )
    `)
    .eq('recruiter_id', recruiterId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved candidates:', error)
    return []
  }

  // Transform to match expected structure if needed, or return raw with join
  // We need student details from 'students' table too? 
  // Let's stick to profile for now, or do a deeper fetch if needed.
  return data || []
}

export async function getSavedCandidateStudentIds(recruiterId: string, studentIds?: string[]) {
  noStore()
  const supabase = await createClient()

  let query = supabase
    .from('saved_candidates')
    .select('student_id')
    .eq('recruiter_id', recruiterId)

  if (studentIds && studentIds.length > 0) {
    query = query.in('student_id', studentIds)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching saved candidate IDs:', error)
    return []
  }

  return (data || [])
    .map((row: any) => row.student_id)
    .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
}

function revalidateRecruiterCandidatePaths(org?: string, studentId?: string) {
  if (!org) return

  revalidatePath(`/${org}/applications`)
  revalidatePath(`/${org}/saved-candidates`)

  if (studentId) {
    revalidatePath(`/${org}/candidates/${studentId}`)
  }
}

export async function saveCandidateForRecruiter(studentId: string, org?: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'recruiter') {
    return { success: false, message: 'Unauthorized' }
  }

  if (!studentId) {
    return { success: false, message: 'Missing student ID' }
  }

  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from('saved_candidates')
    .select('id')
    .eq('recruiter_id', profile.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking existing saved candidate:', existingError)
    return { success: false, message: 'Failed to check existing saved candidate' }
  }

  if (existing) {
    revalidateRecruiterCandidatePaths(org, studentId)
    return { success: true, message: 'Candidate already saved' }
  }

  const { error } = await supabase
    .from('saved_candidates')
    .insert({
      recruiter_id: profile.id,
      student_id: studentId,
    })

  if (error) {
    if (error.code === '23505') {
      revalidateRecruiterCandidatePaths(org, studentId)
      return { success: true, message: 'Candidate already saved' }
    }
    console.error('Error saving candidate:', error)
    return { success: false, message: 'Failed to save candidate' }
  }

  revalidateRecruiterCandidatePaths(org, studentId)

  return { success: true, message: 'Candidate saved successfully' }
}

export async function unsaveCandidateForRecruiter(studentId: string, org?: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'recruiter') {
    return { success: false, message: 'Unauthorized' }
  }

  if (!studentId) {
    return { success: false, message: 'Missing student ID' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_candidates')
    .delete()
    .eq('recruiter_id', profile.id)
    .eq('student_id', studentId)

  if (error) {
    console.error('Error removing saved candidate:', error)
    return { success: false, message: 'Failed to remove saved candidate' }
  }

  revalidateRecruiterCandidatePaths(org, studentId)

  return { success: true, message: 'Candidate removed from saved list' }
}

// =============================================
// INTERVIEWS
// =============================================

export async function getInterviews(userId: string, role: 'recruiter' | 'student') {
  const supabase = await createClient()
  const column = role === 'recruiter' ? 'recruiter_id' : 'student_id'

  const { data, error } = await supabase
    .from('interviews')
    .select(`
      *,
      student:profiles!interviews_student_id_fkey(*),
      recruiter:profiles!interviews_recruiter_id_fkey(*),
      job:jobs(*)
    `)
    .eq(column, userId)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching interviews:', error)
    return []
  }
  return data || []
}



// =============================================
// MISSING FACULTY & ADMIN FUNCTIONS
// =============================================

export async function getAcademicRecordsByFaculty(facultyId: string) {
  const supabase = await createClient()

  // Scope records to the faculty's own courses to avoid leaking/incorrect records.
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', facultyId).single()
  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id').eq('faculty_id', facultyId)
    courses = data || []
  }
  const courseIds = courses?.map((c: any) => c.id) || []
  if (courseIds.length === 0) return []

  const { data } = await supabase
    .from('academic_records')
    .select('*, student:profiles!academic_records_student_id_fkey(full_name), course:courses(*)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false })

  return data || []
}

export async function verifyAcademicRecord(recordId: string, facultyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('academic_records')
    .update({
      verified: true,
      verified_by: facultyId,
      verified_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', recordId)
    .select()

  return !error
}

export async function bulkVerifyAcademicRecords(recordIds: string[], facultyId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('academic_records')
    .update({
      verified: true,
      verified_by: facultyId,
      verified_date: new Date().toISOString().split('T')[0]
    })
    .in('id', recordIds)

  return !error
}

export async function getAssignmentsByFaculty(facultyId: string) {
  const supabase = await createClient()
  const { data: fac } = await supabase.from('faculty').select('id').eq('profile_id', facultyId).single()

  let courses: any[] = []
  if (fac?.id) {
    const { data } = await supabase.from('courses').select('id').eq('instructor_id', fac.id)
    courses = data || []
  }
  if (courses.length === 0) {
    const { data } = await supabase.from('courses').select('id').eq('faculty_id', facultyId)
    courses = data || []
  }

  const courseIds = courses?.map(c => c.id) || []
  if (courseIds.length === 0) return []

  const { data } = await supabase
    .from('assignments')
    .select('*, course:courses(name, code)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createAssignment(assignment: any) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('assignments').insert([assignment]).select().single()
  if (error) console.error('Error creating assignment:', error)
  return data
}

export async function deleteAssignment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  return !error
}

export async function getAssignmentSubmissions(assignmentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('assignment_submissions')
    .select('*, student:profiles!assignment_submissions_student_id_fkey(full_name)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  return data || []
}

export async function createCapstoneProject(project: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('student_projects').insert([{ ...project, is_capstone: true }]).select().single()
  return data
}

export async function updateCapstoneMilestone(projectId: string, milestone: string, status: string) {
  const supabase = await createClient()
  // First get current project
  const { data: project } = await supabase.from('student_projects').select('milestones').eq('id', projectId).single()

  let milestones = project?.milestones || {}
  if (typeof milestones === 'string') milestones = JSON.parse(milestones)

  milestones[milestone] = status

  const { data } = await supabase.from('student_projects').update({ milestones }).eq('id', projectId).select().single()
  return data
}

export async function gradeCapstoneProject(projectId: string, grade: string, feedback: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('student_projects').update({ grade, feedback }).eq('id', projectId).select().single()
  return data
}

export async function createCourseAction(course: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').insert([course]).select().single()
  return data
}

export async function updateCourseAction(id: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('courses').update(updates).eq('id', id).select().single()
  return data
}

export async function getCourseMaterials(courseId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
  return data || []
}

export async function uploadCourseMaterial(material: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('course_materials').insert([material]).select().single()
  return data
}

export async function getFacultyProfile(userId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: fac }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('faculty').select('*').eq('profile_id', userId).single(),
  ])
  return { ...profile, ...fac }
}

export async function updateFacultyProfile(userId: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('faculty').update(updates).eq('profile_id', userId).select().single()
  return data
}

export async function updateRecruiterProfile(userId: string, updates: any) {
  const supabase = await createClient()
  const { data } = await supabase.from('recruiters').update(updates).eq('profile_id', userId).select().single()
  return data
}

export async function getCommonSkills() {
  const supabase = await createClient()

  // Try the common_skills materialized view first
  const { data: viewData, error: viewError } = await supabase
    .from('common_skills')
    .select('skill_name, user_count, skill_category')
    .order('user_count', { ascending: false })
    .limit(100)

  if (!viewError && viewData && viewData.length > 0) {
    return viewData
  }

  // Fallback: aggregate unique skills from user_skills table
  const { data } = await supabase
    .from('user_skills')
    .select('skill_name, skill_category')
    .order('skill_name')

  if (!data) return []

  const seen = new Set<string>()
  return data
    .filter(s => {
      if (seen.has(s.skill_name)) return false
      seen.add(s.skill_name)
      return true
    })
    .map(s => ({ skill_name: s.skill_name, skill_category: s.skill_category, user_count: 1 }))
}

// =============================================
// ANALYTICS DASHBOARD
// =============================================

export async function getAnalyticsData(recruiterId: string) {
  const supabase = await createClient()

  try {
    // 1. Resolve company context first so analytics stays aligned with
    // recruiter dashboard and applications pages (company-wide visibility).
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('company_name, company')
      .eq('profile_id', recruiterId)
      .single()

    const companyName = recruiter?.company_name || recruiter?.company

    const jobsQuery = companyName
      ? supabase.from('jobs').select('id, title, views_count, status').or(`recruiter_id.eq.${recruiterId},company.eq.${companyName}`)
      : supabase.from('jobs').select('id, title, views_count, status').eq('recruiter_id', recruiterId)

    const { data: jobs, error: jobsError } = await jobsQuery

    if (jobsError) {
      console.error('Error fetching jobs for analytics:', jobsError)
      return null
    }

    const jobIds = jobs?.map(j => j.id) || []
    const totalViews = jobs?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0

    // 2. Get all applications for these jobs
    let applications: any[] = []
    if (jobIds.length > 0) {
      // Step 2.1: Fetch applications, getting the student_id (which is a profile_id)
      const { data: apps, error: appError } = await supabase
        .from('job_applications')
        .select(`id, status, applied_at, job_id, student_id`)
        .in('job_id', jobIds)

      if (appError || !apps) {
        console.error('Error fetching job applications:', appError)
        applications = []
      } else {
        // Step 2.2: Extract unique student profile IDs from the applications
        const studentProfileIds = [...new Set(apps.map(app => app.student_id).filter(Boolean))];

        let studentsMap = new Map();
        if (studentProfileIds.length > 0) {
          // Step 2.3: Fetch the corresponding student and profile records
          const { data: students, error: studentError } = await supabase
            .from('students')
            .select(`profile_id, major, program, department, enrollment_number, profiles(full_name, email, phone)`)
            .in('profile_id', studentProfileIds);
          
          if (studentError) {
            console.error('Error fetching student data:', studentError);
          } else if (students) {
            // Create a map for easy lookup
            for (const student of students) {
                studentsMap.set(student.profile_id, student);
            }
          }
        }

        // Step 2.4: Manually join the applications with the student data
        applications = apps.map(app => ({
            ...app,
            student: studentsMap.get(app.student_id) || null
        }));
      }
    }

    // 3. Aggregate Stats
    const totalApplications = applications.length
    const shortlisted = applications.filter(a => a.status === 'shortlisted' || a.status === 'accepted').length
    const interviews = applications.filter(a => a.status === 'interviewing').length

    // 4. Status Breakdown
    const statusCounts = applications.reduce((acc: any, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {})

    const statusBreakdown = Object.keys(statusCounts).map(status => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: statusCounts[status]
    }))

    // 5. Applications Over Time (Smart Range)
    // Find the most recent application date to anchor the graph
    let anchorDate = new Date()
    if (applications.length > 0) {
      const dates = applications.map((a: any) => new Date(a.applied_at).getTime())
      const maxDate = new Date(Math.max(...dates))
      const daysDiff = (anchorDate.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24)
      
      // If most recent app is older than 7 days, shift graph to show that history
      if (daysDiff > 7) {
        anchorDate = maxDate
      }
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchorDate)
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0] // YYYY-MM-DD
    }).reverse()

    const trendMap = applications.reduce((acc: any, app) => {
      if (app.applied_at) {
        const date = app.applied_at.split('T')[0]
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    }, {})

    const applicationsOverTime = last7Days.map(date => {
      const d = new Date(date)
      // Format: "Jan 10" to be more explicit about the date range
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        count: trendMap[date] || 0
      }
    })

    // 6. Top Majors
    const majorCounts = applications.reduce((acc: any, app) => {
      // app.student is the student record now (due to corrected query)
      // It directly contains 'major'
      const major = app.student?.major || 'Unknown'
      
      acc[major] = (acc[major] || 0) + 1
      return acc
    }, {})

    const topCourses = Object.keys(majorCounts)
      .map(major => ({
        course: major, // Keeping key 'course' to match client component props
        applications: majorCounts[major]
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)

    return {
      totalApplications,
      jobViews: totalViews,
      shortlisted,
      interviews,
      applicationsOverTime,
      statusBreakdown,
      topCourses
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return null
  }
}

// =============================================
// LEARNING RESOURCES
// =============================================

export async function getLearningResources() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('learning_resources')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching learning resources:', error)
    return []
  }

  return data.map((resource: any) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    category: resource.category,
    duration: resource.duration || undefined,
    fileSize: resource.file_size || undefined,
    author: resource.author || undefined,
    url: resource.url
  }))
}
