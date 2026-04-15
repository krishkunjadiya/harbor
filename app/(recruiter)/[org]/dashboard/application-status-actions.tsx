'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { updateApplicationStatus } from "@/lib/actions/mutations"
import { 
  CheckCircle,
  XCircle,
  Clock,
  SpinnerGap as Loader2Icon } from "@phosphor-icons/react/dist/ssr"
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

interface ApplicationStatusActionsProps {
  applicationId: string
  currentStatus: string
}

export function ApplicationStatusActions({ applicationId, currentStatus }: ApplicationStatusActionsProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleStatusChange = async (newStatus: 'reviewing' | 'shortlisted' | 'rejected' | 'accepted') => {
    setIsLoading(true)
    try {
      const result = await updateApplicationStatus(applicationId, newStatus)
      if (result.success) {
        setStatus(newStatus)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['recruiter', 'dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['recruiter', 'reports-recent'] }),
        ])
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-8">
        <Loader2Icon className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <div className="flex gap-1">
      {status === 'pending' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs disabled:opacity-60"
          onClick={() => handleStatusChange('reviewing')}
          disabled={isLoading}
        >
          <Clock className="h-3 w-3 mr-1" />
          Review
        </Button>
      )}
      
      {(status === 'pending' || status === 'reviewing') && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs text-info border-info/30 hover:bg-info/10 disabled:text-info/50 disabled:border-info/20 disabled:opacity-60"
          onClick={() => handleStatusChange('shortlisted')}
          disabled={isLoading}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Shortlist
        </Button>
      )}

      {status === 'shortlisted' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs text-success border-success/30 hover:bg-success/10 disabled:text-success/50 disabled:border-success/20 disabled:opacity-60"
          onClick={() => handleStatusChange('accepted')}
          disabled={isLoading}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Accept
        </Button>
      )}

      {status !== 'rejected' && status !== 'accepted' && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 disabled:text-destructive/50 disabled:border-destructive/20 disabled:opacity-60"
          onClick={() => handleStatusChange('rejected')}
          disabled={isLoading}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Reject
        </Button>
      )}
    </div>
  )
}
