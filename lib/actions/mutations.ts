'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/cached'
import type {
  Job,
  JobApplication,
  Notification,
  Credential
} from '@/lib/types/database'
// =============================================
// JOB ACTIONS
// =============================================

export async function createJob(
  jobData: Partial<Job>
): Promise<{ success: boolean; data?: Job; error?: string }> {
  const supabase = await createClient()

  try {
    const currentProfile = await getCurrentProfile()
    if (!currentProfile || currentProfile.user_type !== 'recruiter') {
      return { success: false, error: 'Unauthorized recruiter context.' }
    }

    const recruiterId = currentProfile.id

    const title = jobData.title?.trim()
    const description = jobData.description?.trim()

    if (!title || !description) {
      return { success: false, error: 'Job title and description are required.' }
    }

    const requestedStatus = jobData.status
    const status: Job['status'] =
      requestedStatus === 'draft' || requestedStatus === 'closed' || requestedStatus === 'active'
        ? requestedStatus
        : 'active'

    const normalizedRequirements = Array.isArray(jobData.requirements)
      ? jobData.requirements.map((value) => value?.trim()).filter((value): value is string => Boolean(value))
      : null

    const normalizedSkillsRequired = Array.isArray(jobData.skills_required)
      ? Array.from(new Set(jobData.skills_required.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
      : null

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        title,
        description,
        requirements: normalizedRequirements,
        skills_required: normalizedSkillsRequired,
        recruiter_id: recruiterId,
        status,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Job }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateJob(
  recruiterId: string,
  jobId: string,
  jobData: Pick<Job, 'title' | 'description'>
): Promise<{ success: boolean; data?: Job; error?: string }> {
  const supabase = await createClient()

  const currentProfile = await getCurrentProfile()
  if (!currentProfile || currentProfile.user_type !== 'recruiter' || currentProfile.id !== recruiterId) {
    return { success: false, error: 'Unauthorized recruiter context.' }
  }

  const title = jobData.title?.trim()
  const description = jobData.description?.trim()

  if (!title || !description) {
    return { success: false, error: 'Job title and description are required.' }
  }

  const { data: recruiterContext, error: recruiterContextError } = await supabase
    .from('recruiters')
    .select('company_name, company')
    .or(`profile_id.eq.${recruiterId},id.eq.${recruiterId}`)
    .maybeSingle()

  if (recruiterContextError) {
    return { success: false, error: recruiterContextError.message }
  }

  const recruiterCompany = recruiterContext?.company_name?.trim() || recruiterContext?.company?.trim() || null

  const { data: existingJob, error: existingJobError } = await supabase
    .from('jobs')
    .select('id, recruiter_id, company')
    .eq('id', jobId)
    .maybeSingle()

  if (existingJobError) {
    return { success: false, error: existingJobError.message }
  }

  if (!existingJob) {
    return { success: false, error: 'Job not found.' }
  }

  const isOwnedJob = existingJob.recruiter_id === recruiterId
  const isSameCompany = Boolean(
    recruiterCompany &&
    existingJob.company &&
    String(existingJob.company).trim() === recruiterCompany
  )

  if (!isOwnedJob && !isSameCompany) {
    return { success: false, error: 'Job not found for this recruiter scope.' }
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({
      title,
      description,
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Job }
}

export async function updateJobStatus(
  jobId: string,
  status: 'active' | 'closed' | 'draft'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const currentProfile = await getCurrentProfile()
    if (!currentProfile || currentProfile.user_type !== 'recruiter') {
      return { success: false, error: 'Unauthorized recruiter context.' }
    }

    const { data: recruiterContext, error: recruiterContextError } = await supabase
      .from('recruiters')
      .select('company_name, company')
      .or(`profile_id.eq.${currentProfile.id},id.eq.${currentProfile.id}`)
      .maybeSingle()

    if (recruiterContextError) {
      return { success: false, error: recruiterContextError.message }
    }

    const recruiterCompany = recruiterContext?.company_name?.trim() || recruiterContext?.company?.trim() || null

    const { data: existingJob, error: existingJobError } = await supabase
      .from('jobs')
      .select('id, recruiter_id, company')
      .eq('id', jobId)
      .maybeSingle()

    if (existingJobError) {
      return { success: false, error: existingJobError.message }
    }

    if (!existingJob) {
      return { success: false, error: 'Job not found.' }
    }

    const isOwnedJob = existingJob.recruiter_id === currentProfile.id
    const isSameCompany = Boolean(
      recruiterCompany &&
      existingJob.company &&
      String(existingJob.company).trim() === recruiterCompany
    )

    if (!isOwnedJob && !isSameCompany) {
      return { success: false, error: 'Job not found for this recruiter scope.' }
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function incrementJobViews(
  jobId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const shouldLogRpcFailure = process.env.NODE_ENV === 'development'

  try {
    const { error } = await supabase.rpc('increment_job_views', {
      job_id: jobId
    })

    if (error) {
      // If the RPC fails (e.g. not created yet), fallback to the direct update
      // though this will likely fail due to RLS, it provides a graceful path
      if (shouldLogRpcFailure) {
        console.warn('RPC increment_job_views failed, falling back to direct update:', error.message)
      }

      const { data: job } = await supabase
        .from('jobs')
        .select('views_count')
        .eq('id', jobId)
        .single()

      if (job) {
        await supabase
          .from('jobs')
          .update({ views_count: (job.views_count || 0) + 1 })
          .eq('id', jobId)
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function applyToJob(
  studentId: string,
  jobId: string,
  coverLetter?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Check if already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('job_id', jobId)
      .single()

    if (existing) {
      return { success: false, error: 'Already applied to this job' }
    }

    const { error } = await supabase
      .from('job_applications')
      .insert({
        student_id: studentId,
        job_id: jobId,
        cover_letter: coverLetter,
        status: 'pending',
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Increment the applications_count for the job (using SECURITY DEFINER RPC to bypass RLS)
    try {
      const { error: rpcError } = await supabase.rpc('increment_job_applications_count', { job_id: jobId })
      if (rpcError) {
        // Fallback: try direct update (may be blocked by RLS on some setups)
        const { data: jobData } = await supabase.from('jobs').select('applications_count').eq('id', jobId).single()
        if (jobData) {
          await supabase.from('jobs').update({ applications_count: (jobData.applications_count || 0) + 1 }).eq('id', jobId)
        }
      }
    } catch {
      // Non-critical: applications_count will self-correct on next query
    }

    // Create notification for recruiter
    const { data: job } = await supabase
      .from('jobs')
      .select('recruiter_id, title')
      .eq('id', jobId)
      .single()

    if (job) {
      const { data: recruiterOrgData } = await supabase
        .from('recruiters')
        .select('company_name, company')
        .or(`profile_id.eq.${job.recruiter_id},id.eq.${job.recruiter_id}`)
        .maybeSingle()

      const rawOrg = recruiterOrgData?.company_name || recruiterOrgData?.company || 'recruiter'
      const recruiterOrg = String(rawOrg)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .trim() || 'recruiter'

      await createNotification(
        job.recruiter_id,
        'application',
        `New application received for ${job.title}`,
        `/${recruiterOrg}/applications`
      )
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const currentProfile = await getCurrentProfile()
    if (!currentProfile || currentProfile.user_type !== 'recruiter') {
      return { success: false, error: 'Unauthorized recruiter context.' }
    }

    const { data: recruiterContext, error: recruiterContextError } = await supabase
      .from('recruiters')
      .select('company_name, company')
      .or(`profile_id.eq.${currentProfile.id},id.eq.${currentProfile.id}`)
      .maybeSingle()

    if (recruiterContextError) {
      return { success: false, error: recruiterContextError.message }
    }

    const recruiterCompany = recruiterContext?.company_name?.trim() || recruiterContext?.company?.trim() || null

    const { data: application, error: fetchError } = await supabase
      .from('job_applications')
      .select('student_id, job_id, job:jobs(title, recruiter_id, company)')
      .eq('id', applicationId)
      .maybeSingle()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    if (!application) {
      return { success: false, error: 'Application not found.' }
    }

    const job = application.job as any
    const isOwnedJob = job?.recruiter_id === currentProfile.id
    const isSameCompany = Boolean(
      recruiterCompany &&
      job?.company &&
      String(job.company).trim() === recruiterCompany
    )

    if (!isOwnedJob && !isSameCompany) {
      return { success: false, error: 'Application is not in this recruiter scope.' }
    }

    const { error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify student of status change
    if (application) {
      const jobTitle = (application.job as any)?.title || 'a job'
      await createNotification(
        application.student_id,
        'application_update',
        `Your application for ${jobTitle} was ${status}`,
        `/student/applications`
      )
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function withdrawApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get application details first
    const { data: application, error: fetchError } = await supabase
      .from('job_applications')
      .select('status, student_id')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return { success: false, error: 'Application not found' }
    }

    // Disallow withdrawal only once accepted or already rejected
    if (application.status === 'accepted' || application.status === 'rejected') {
      return { success: false, error: `Cannot withdraw an application that has been ${application.status}` }
    }

    // Delete the application
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', applicationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================
// CREDENTIAL ACTIONS
// =============================================

export async function createCredential(
  userId: string,
  credentialData: Partial<Credential>
): Promise<{ success: boolean; data?: Credential; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('credentials')
      .insert({
        ...credentialData,
        user_id: userId,
        verified: false,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as Credential }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function verifyCredential(
  credentialId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: credential, error: fetchError } = await supabase
      .from('credentials')
      .select('user_id, credential_name')
      .eq('id', credentialId)
      .single()

    const { error } = await supabase
      .from('credentials')
      .update({ verified })
      .eq('id', credentialId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify user
    if (credential) {
      await createNotification(
        credential.user_id,
        'credential_verified',
        `Your ${credential.credential_name} has been verified`,
        `/student/credentials`
      )
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteCredential(
  credentialId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('id', credentialId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function downloadCredential(
  credentialId: string,
  fileName: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('credential_url')
      .eq('id', credentialId)
      .single()

    if (error || !data?.credential_url) {
      return { success: false, error: 'Credential not found' }
    }

    return { success: true, url: data.credential_url }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================
// NOTIFICATION ACTIONS
// =============================================

// Map internal event types to DB-valid type and category values
function resolveNotificationType(eventType: string): { type: 'info' | 'success' | 'warning' | 'error'; category: 'job' | 'application' | 'system' | 'message' } {
  switch (eventType) {
    case 'application': return { type: 'info', category: 'application' }
    case 'application_update': return { type: 'info', category: 'application' }
    case 'credential_verified': return { type: 'success', category: 'system' }
    case 'job': return { type: 'info', category: 'job' }
    case 'system': return { type: 'info', category: 'system' }
    case 'message': return { type: 'info', category: 'message' }
    default: return { type: 'info', category: 'system' }
  }
}

export async function createNotification(
  userId: string,
  eventType: string,
  message: string,
  actionUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { type, category } = resolveNotificationType(eventType)
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: message,
        message,
        type,
        category,
        action_url: actionUrl,
        read: false,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================
// USER ACTIONS
// =============================================

export async function updateUserProfile(
  userId: string,
  updates: Partial<{ full_name: string; avatar_url: string }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateStudentProfile(
  studentId: string,
  updates: Partial<{ resume_url: string; gpa: number; major: string; graduation_year: number; resume_score: number | null; resume_feedback: any }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('profile_id', studentId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Delete profile (will cascade to related tables)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =============================================
// ACTIVITY TRACKING
// =============================================

export async function trackActivity(
  userId: string,
  activityType: string,
  activityData?: any
): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        description: activityData?.description || null,
        metadata: activityData || {},
      })
  } catch (error) {
    console.error('Error tracking activity:', error)
  }
}

// =============================================
// INTERVIEW ACTIONS
// =============================================

export async function createInterview(interviewData: {
  recruiter_id: string
  student_id?: string
  candidate_name?: string
  job_id?: string
  position?: string
  scheduled_at: string
  duration_min: number
  type: string
  location: string
  notes?: string
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  const currentProfile = await getCurrentProfile()
  if (!currentProfile || currentProfile.user_type !== 'recruiter' || currentProfile.id !== interviewData.recruiter_id) {
    return { success: false, error: 'Unauthorized recruiter context.' }
  }

  if (!interviewData.student_id || !interviewData.job_id) {
    return { success: false, error: 'A valid candidate and job must be selected.' }
  }

  const { data: recruiterContext, error: recruiterContextError } = await supabase
    .from('recruiters')
    .select('company_name, company')
    .or(`profile_id.eq.${interviewData.recruiter_id},id.eq.${interviewData.recruiter_id}`)
    .maybeSingle()

  if (recruiterContextError) {
    return { success: false, error: recruiterContextError.message }
  }

  const recruiterCompany = recruiterContext?.company_name?.trim() || recruiterContext?.company?.trim() || null

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, recruiter_id, company')
    .eq('id', interviewData.job_id)
    .maybeSingle()

  if (jobError) {
    return { success: false, error: jobError.message }
  }

  if (!job) {
    return { success: false, error: 'Selected job was not found.' }
  }

  const isOwnedJob = job.recruiter_id === interviewData.recruiter_id
  const isSameCompany = Boolean(
    recruiterCompany &&
    job.company &&
    String(job.company).trim() === recruiterCompany
  )

  if (!isOwnedJob && !isSameCompany) {
    return { success: false, error: 'Selected job is not in this recruiter scope.' }
  }

  const { data: application, error: applicationError } = await supabase
    .from('job_applications')
    .select('id')
    .eq('student_id', interviewData.student_id)
    .eq('job_id', interviewData.job_id)
    .in('status', ['shortlisted', 'accepted'])
    .maybeSingle()

  if (applicationError) {
    return { success: false, error: applicationError.message }
  }

  if (!application) {
    return {
      success: false,
      error: 'Candidate must have a shortlisted or accepted application for this job.'
    }
  }

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      recruiter_id: interviewData.recruiter_id,
      student_id: interviewData.student_id,
      job_id: interviewData.job_id,
      scheduled_at: interviewData.scheduled_at,
      duration_min: interviewData.duration_min,
      type: interviewData.type,
      status: 'scheduled',
      meeting_link: interviewData.location,
      notes: interviewData.notes
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function rescheduleInterview(interviewData: {
  interview_id: string
  recruiter_id: string
  scheduled_at: string
  location?: string
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  const currentProfile = await getCurrentProfile()
  if (!currentProfile || currentProfile.user_type !== 'recruiter' || currentProfile.id !== interviewData.recruiter_id) {
    return { success: false, error: 'Unauthorized recruiter context.' }
  }

  const { data: existingInterview, error: existingError } = await supabase
    .from('interviews')
    .select('id, status')
    .eq('id', interviewData.interview_id)
    .eq('recruiter_id', interviewData.recruiter_id)
    .maybeSingle()

  if (existingError) {
    return { success: false, error: existingError.message }
  }

  if (!existingInterview) {
    return { success: false, error: 'Interview not found for this recruiter.' }
  }

  if (existingInterview.status === 'cancelled') {
    return { success: false, error: 'Cancelled interviews cannot be rescheduled.' }
  }

  const updatePayload: Record<string, any> = {
    scheduled_at: interviewData.scheduled_at,
    status: 'scheduled'
  }

  if (typeof interviewData.location === 'string') {
    updatePayload.meeting_link = interviewData.location
  }

  const { data, error } = await supabase
    .from('interviews')
    .update(updatePayload)
    .eq('id', interviewData.interview_id)
    .eq('recruiter_id', interviewData.recruiter_id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function cancelInterview(interviewData: {
  interview_id: string
  recruiter_id: string
}): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  const currentProfile = await getCurrentProfile()
  if (!currentProfile || currentProfile.user_type !== 'recruiter' || currentProfile.id !== interviewData.recruiter_id) {
    return { success: false, error: 'Unauthorized recruiter context.' }
  }

  const { data: existingInterview, error: existingError } = await supabase
    .from('interviews')
    .select('id, status')
    .eq('id', interviewData.interview_id)
    .eq('recruiter_id', interviewData.recruiter_id)
    .maybeSingle()

  if (existingError) {
    return { success: false, error: existingError.message }
  }

  if (!existingInterview) {
    return { success: false, error: 'Interview not found for this recruiter.' }
  }

  if (existingInterview.status === 'cancelled') {
    return { success: true, data: existingInterview }
  }

  const { data, error } = await supabase
    .from('interviews')
    .update({ status: 'cancelled' })
    .eq('id', interviewData.interview_id)
    .eq('recruiter_id', interviewData.recruiter_id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

// =============================================
// BACKGROUND WORKERS (AI RESUME ANALYSIS)
// =============================================

export async function triggerDocumentParser(studentId: string, documentUrl: string, filePath?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Call the Python AI worker directly from this server action.
    // This replaces the previous Inngest event approach which required a
    // running Inngest dev server AND the Python worker to both be registered.
    const workerUrl = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'
    const response = await fetch(`${workerUrl}/analyze-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        fileUrl: documentUrl,
        filePath: filePath || '',
        documentType: 'resume',
      }),
      // Allow up to 60 seconds for AI analysis
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      console.error('[triggerDocumentParser] Worker error:', err)
      return { success: false, error: err.error || response.statusText }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[triggerDocumentParser] Failed to call AI worker:', error.message)
    // Non-blocking: resume was uploaded — analysis can be retried
    return { success: false, error: error.message }
  }
}
