import { ChartLine as PerformanceIcon } from '@phosphor-icons/react/dist/ssr'

import { DashboardHeader } from '@/components/header'
import { getPerformanceTrackerData } from '@/lib/actions/interview'
import { PerformanceClient } from '../interview/performance/performance-client'

export default async function InterviewPerformancePage() {
  const performanceData = await getPerformanceTrackerData()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <DashboardHeader title="Performance Tracker" icon={PerformanceIcon} />
        <p className="text-muted-foreground">
          Review your interview analytics, identify weak topics, and track recent learning activity.
        </p>
      </div>

      <PerformanceClient data={performanceData} />
    </div>
  )
}
