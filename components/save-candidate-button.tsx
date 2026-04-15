'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { saveCandidateForRecruiter, unsaveCandidateForRecruiter } from '@/lib/actions/database'

type SaveCandidateButtonProps = {
  candidateId: string
  isSaved: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function SaveCandidateButton({
  candidateId,
  isSaved,
  size = 'default',
  className,
}: SaveCandidateButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  const org = (pathname || '/').split('/').filter(Boolean)[0]

  const handleToggleSave = () => {
    startTransition(async () => {
      const result = isSaved
        ? await unsaveCandidateForRecruiter(candidateId, org)
        : await saveCandidateForRecruiter(candidateId, org)

      if (!result.success) {
        toast.error(result.message || 'Failed to update shortlist')
        return
      }

      toast.success(result.message || (isSaved ? 'Candidate removed from shortlist' : 'Candidate added to shortlist'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recruiter', 'saved-candidates'] }),
        queryClient.invalidateQueries({ queryKey: ['recruiter', 'dashboard'] }),
      ])
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isSaved ? 'secondary' : 'default'}
      onClick={handleToggleSave}
      disabled={isPending}
      className={className}
    >
      {isPending ? 'Updating...' : isSaved ? 'Shortlisted' : 'Add to Shortlist'}
    </Button>
  )
}
