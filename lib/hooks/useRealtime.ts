'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

async function resolveRecruiterContext(supabase: any, recruiterId: string) {
  const canonicalRes = await supabase
    .from('recruiters')
    .select('company_name, company')
    .eq('profile_id', recruiterId)
    .maybeSingle()

  if (canonicalRes.error) {
    console.error('Failed to resolve canonical recruiter context:', canonicalRes.error.message)
  }

  if (canonicalRes.data) {
    return canonicalRes.data
  }

  const legacyRes = await supabase
    .from('recruiters')
    .select('company_name, company')
    .eq('id', recruiterId)
    .maybeSingle()

  if (legacyRes.error) {
    console.error('Failed to resolve legacy recruiter context:', legacyRes.error.message)
  }

  return legacyRes.data || null
}

/**
 * Hook to subscribe to real-time table changes
 */
export function useRealtimeSubscription<T extends Record<string, any> = any>(
  table: string,
  filter?: { column: string; value: string },
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: { old: T }) => void
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Build the subscription
    let subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setData((current) => [...current, payload.new as T])
            onInsert?.(payload.new as T)
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setData((current) =>
              current.map((item: any) =>
                item.id === (payload.new as any).id ? (payload.new as T) : item
              )
            )
            onUpdate?.(payload.new as T)
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setData((current) =>
              current.filter((item: any) => item.id !== (payload.old as any).id)
            )
            onDelete?.({ old: payload.old as T })
          }
        }
      )
      .subscribe()

    setLoading(false)

    return () => {
      subscription.unsubscribe()
    }
  }, [table, filter, onInsert, onUpdate, onDelete])

  return { data, loading }
}

/**
 * Hook to subscribe to real-time notifications for a user
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  const queryKey = useMemo(() => ['notifications', userId] as const, [userId])

  const { data: notifications = [] } = useQuery({
    queryKey,
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!userId) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Failed to fetch notifications:', error.message)
        return []
      }

      return data || []
    },
  })

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          queryClient.setQueryData<any[]>(queryKey, (current = []) => [payload.new as any, ...current])
          setUnreadCount((count) => count + 1)
          
          // Optional: Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Notification', {
              body: (payload.new as any).message,
              icon: '/logo.png'
            })
          }
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          queryClient.setQueryData<any[]>(queryKey, (current = []) =>
            current.map((item) =>
              item.id === (payload.new as any).id ? (payload.new as any) : item
            )
          )
          
          if ((payload.new as any).read && !(payload.old as any).read) {
            setUnreadCount((count) => Math.max(0, count - 1))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient, queryKey, userId])

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length)
  }, [notifications])

  return { notifications, unreadCount }
}

/**
 * Hook to subscribe to real-time job applications for a recruiter
 */
export function useRealtimeJobApplications(recruiterId: string | undefined, initialData: any[] = []) {
  const queryClient = useQueryClient()
  const [newApplicationCount, setNewApplicationCount] = useState(0)

  const queryKey = useMemo(() => ['recruiter-applications', recruiterId] as const, [recruiterId])

  const { data: applications = [] } = useQuery({
    queryKey,
    enabled: Boolean(recruiterId),
    staleTime: 60 * 1000,
    initialData,
    queryFn: async () => {
      if (!recruiterId) return []

      const supabase = createClient()

      // Resolve recruiter/company scope to include all company postings.
      const recruiterData = await resolveRecruiterContext(supabase, recruiterId)

      const companyName = recruiterData?.company_name?.trim() || recruiterData?.company?.trim()
      let jobs: Array<{ id: string }> = []
      let jobsError: Error | null = null

      if (companyName) {
        const [byRecruiterRes, byCompanyRes] = await Promise.all([
          supabase.from('jobs').select('id').eq('recruiter_id', recruiterId),
          supabase.from('jobs').select('id').eq('company', companyName),
        ])

        jobsError = (byRecruiterRes.error || byCompanyRes.error) as Error | null

        const merged = [...(byRecruiterRes.data || []), ...(byCompanyRes.data || [])]
        const seen = new Set<string>()
        jobs = merged.filter((job: any) => {
          if (!job?.id || seen.has(job.id)) return false
          seen.add(job.id)
          return true
        })
      } else {
        const byRecruiterRes = await supabase.from('jobs').select('id').eq('recruiter_id', recruiterId)
        jobsError = byRecruiterRes.error as Error | null
        jobs = byRecruiterRes.data || []
      }

      if (jobsError || !jobs || jobs.length === 0) {
        if (jobsError) {
          console.error('Failed to fetch jobs:', jobsError.message)
        }
        return []
      }

      const jobIds = jobs.map((j) => j.id)

      const { data: initialApps, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          student:profiles!student_id(full_name, email, avatar_url),
          job:jobs(id, title, company, location, job_type)
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false })

      if (appsError) {
        console.error('Failed to fetch applications (joined):', appsError.message)

        const { data: flatApps, error: flatError } = await supabase
          .from('job_applications')
          .select('*')
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false })

        if (flatError) {
          console.error('Failed to fetch applications fallback:', flatError.message)
          return []
        }

        return flatApps || []
      }

      return initialApps || []
    },
  })

  useEffect(() => {
    if (!recruiterId) return

    const supabase = createClient()

    // Subscribe to ALL changes, but filter locally to avoid redundant DB checks
    const channel = supabase
      .channel(`recruiter-apps-${recruiterId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_applications'
        },
        async (payload: any) => {
          const newApp = payload.new as any

          const currentApps = (queryClient.getQueryData<any[]>(queryKey) || [])
          const myJobIds = new Set(currentApps.map((app) => app.job_id).filter(Boolean))

          // Only attempt to fetch if this might be a company job (in myJobIds)
          // OR if myJobIds is empty (initial fetch not yet populated).
          // The RLS policy (updated by fix-company-job-applications-rls.sql) ensures
          // only applications for this recruiter's company are returned.
          if (myJobIds.size > 0 && !myJobIds.has(newApp.job_id)) return

          const { data: fullApplication } = await supabase
            .from('job_applications')
            .select(`
              *,
              student:profiles!student_id(full_name, email, avatar_url),
              job:jobs(id, title, company, location, job_type)
            `)
            .eq('id', newApp.id)
            .single()

          if (fullApplication) {
            queryClient.setQueryData<any[]>(queryKey, (current = []) => {
              if (current.some((a) => a.id === fullApplication.id)) return current
              return [fullApplication, ...current]
            })
            setNewApplicationCount((count) => count + 1)

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Job Application', {
                body: `New application for ${fullApplication.job?.title || 'your job'}`,
                icon: '/logo.png'
              })
            }
          }
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications'
        },
        async (payload: any) => {
          const updatedApp = payload.new as any
          const currentApps = (queryClient.getQueryData<any[]>(queryKey) || [])
          const myJobIds = new Set(currentApps.map((app) => app.job_id).filter(Boolean))
          
          if (myJobIds.has(updatedApp.job_id)) {
            const { data: fullApplication } = await supabase
              .from('job_applications')
              .select(`
                *,
                student:profiles!student_id(full_name, email, avatar_url),
                job:jobs(id, title, company, location, job_type)
              `)
              .eq('id', updatedApp.id)
              .single()

            if (fullApplication) {
              queryClient.setQueryData<any[]>(queryKey, (current = []) =>
                current.map((app) => (app.id === fullApplication.id ? fullApplication : app))
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient, queryKey, recruiterId])

  return { applications, newApplicationCount }
}

/**
 * Hook to request browser notification permission
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }

  return { permission, requestPermission }
}

/**
 * Hook to automatically refresh Analytics Dashboard data when database events occur.
 */
export function useRealtimeAnalytics(recruiterId: string, initialData: any) {
  const [analytics, setAnalytics] = useState(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!recruiterId) return

    const supabase = createClient()

    let isMounted = true
    let relevantJobIds = new Set<string>()
    let relevantCompanyName = ''

    const buildAnalytics = async () => {
      // Resolve recruiter company to include both company and direct recruiter jobs.
      const recruiterData = await resolveRecruiterContext(supabase, recruiterId)

      const companyName = recruiterData?.company_name?.trim() || recruiterData?.company?.trim()
      relevantCompanyName = companyName || ''
      let jobs: Array<{ id: string; title: string; views_count: number | null; status: string | null }> = []
      let jobsError: Error | null = null

      if (companyName) {
        const [byRecruiterRes, byCompanyRes] = await Promise.all([
          supabase.from('jobs').select('id, title, views_count, status').eq('recruiter_id', recruiterId),
          supabase.from('jobs').select('id, title, views_count, status').eq('company', companyName),
        ])

        jobsError = (byRecruiterRes.error || byCompanyRes.error) as Error | null

        const merged = [...(byRecruiterRes.data || []), ...(byCompanyRes.data || [])]
        const byId = new Map<string, any>()
        for (const job of merged) {
          if (job?.id) {
            byId.set(job.id, job)
          }
        }
        jobs = Array.from(byId.values())
      } else {
        const byRecruiterRes = await supabase
          .from('jobs')
          .select('id, title, views_count, status')
          .eq('recruiter_id', recruiterId)

        jobsError = byRecruiterRes.error as Error | null
        jobs = byRecruiterRes.data || []
      }

      if (jobsError) {
        throw jobsError
      }

      relevantJobIds = new Set((jobs || []).map((j: any) => j.id))
      const jobIds = Array.from(relevantJobIds)
      const totalViews = (jobs || []).reduce((sum: number, job: any) => sum + (job.views_count || 0), 0)

      let applications: any[] = []
      if (jobIds.length > 0) {
        const { data: apps, error: appError } = await supabase
          .from('job_applications')
          .select('id, status, applied_at, job_id, student_id')
          .in('job_id', jobIds)

        if (appError) {
          throw appError
        }

        const studentProfileIds = [...new Set((apps || []).map((app: any) => app.student_id).filter(Boolean))]
        let studentsMap = new Map<string, any>()

        if (studentProfileIds.length > 0) {
          const { data: students, error: studentError } = await supabase
            .from('students')
            .select('profile_id, major, program')
            .in('profile_id', studentProfileIds)

          if (studentError) {
            throw studentError
          }

          for (const student of students || []) {
            studentsMap.set(student.profile_id, student)
          }
        }

        applications = (apps || []).map((app: any) => ({
          ...app,
          student: studentsMap.get(app.student_id) || null
        }))
      }

      const totalApplications = applications.length
      const shortlisted = applications.filter((a: any) => a.status === 'shortlisted').length
      const interviews = applications.filter((a: any) => a.status === 'interviewing').length

      const statusCounts = applications.reduce((acc: Record<string, number>, app: any) => {
        const key = app.status || 'unknown'
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      const statusBreakdown = Object.keys(statusCounts).map((status) => ({
        status,
        count: statusCounts[status]
      }))

      let anchorDate = new Date()
      if (applications.length > 0) {
        const dates = applications
          .map((a: any) => (a.applied_at ? new Date(a.applied_at).getTime() : 0))
          .filter((d: number) => d > 0)

        if (dates.length > 0) {
          const maxDate = new Date(Math.max(...dates))
          const daysDiff = (anchorDate.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff > 7) {
            anchorDate = maxDate
          }
        }
      }

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchorDate)
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const trendMap = applications.reduce((acc: Record<string, number>, app: any) => {
        if (app.applied_at) {
          const date = app.applied_at.split('T')[0]
          acc[date] = (acc[date] || 0) + 1
        }
        return acc
      }, {})

      const applicationsOverTime = last7Days.map((date) => {
        const d = new Date(date)
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date,
          count: trendMap[date] || 0
        }
      })

      const majorCounts = applications.reduce((acc: Record<string, number>, app: any) => {
        const major = app.student?.major || 'Unknown'
        acc[major] = (acc[major] || 0) + 1
        return acc
      }, {})

      const topCourses = Object.keys(majorCounts)
        .map((major) => ({
          course: major,
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
    }
    
    // Function to re-fetch and update state
    const refreshData = async () => {
      try {
        if (!isMounted) return
        setIsRefreshing(true)
        setError(null)
        const freshData = await buildAnalytics()
        if (freshData) {
          if (isMounted) {
            setAnalytics(freshData)
          }
        }
      } catch (e) {
        console.error('Failed to refresh analytics:', e)
        if (isMounted) {
          setError('Unable to fetch the latest analytics data.')
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false)
          setIsLoading(false)
        }
      }
    }

    // We ALREADY HAVE initialData from the server, so DO NOT fetch on mount.
    // It doubles the workload and causes the 5-8 second freeze.
    // Instead, rely on the server data until a websocket event actually fires.
    setIsLoading(false);

    // Subscribe to applications, jobs, and interviews changes
    const channel = supabase.channel(`analytics-changes-${recruiterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications' },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload: any) => {
          const changedJob = payload?.new || payload?.old
          if (!changedJob) {
            refreshData()
            return
          }

          // Trigger on direct recruiter jobs, known company jobs, or jobs we already track.
          if (
            changedJob.recruiter_id === recruiterId ||
            (relevantCompanyName && changedJob.company === relevantCompanyName) ||
            relevantJobIds.has(changedJob.id)
          ) {
            refreshData()
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, refreshData)
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [recruiterId])

  return { analytics, isRefreshing, isLoading, error }
}
