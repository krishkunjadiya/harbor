'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, DownloadSimple as Download, Calendar, ChartBar, SpinnerGap as Loader2Icon, File } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDateUTC } from '@/lib/utils/date-format'
import { 
  generateApplicationsReportFile,
  generateCandidatesReportFile,
  generateInterviewsPDFReportFile,
  generatePerformancePDFReportFile,
  getReportStatusPreview,
  getRecentReports,
  logGeneratedReport
} from '@/lib/actions/reports'

type ReportType = 'applications' | 'candidates' | 'interviews' | 'performance'
type ReportFormat = 'csv' | 'excel' | 'pdf'

const reportTypes = [
  {
    id: 'applications' as ReportType,
    title: 'Applications Report',
    description: 'Detailed report of all job applications (CSV)',
    icon: FileText,
    color: 'bg-info/15 text-info',
    defaultFormat: 'csv' as ReportFormat,
    allowedFormats: ['csv'] as ReportFormat[]
  },
  {
    id: 'candidates' as ReportType,
    title: 'Candidate Pipeline',
    description: 'Candidate progress through hiring stages (Excel)',
    icon: ChartBar,
    color: 'bg-success/15 text-success',
    defaultFormat: 'excel' as ReportFormat,
    allowedFormats: ['csv', 'excel'] as ReportFormat[]
  },
  {
    id: 'interviews' as ReportType,
    title: 'Interview Analytics',
    description: 'Interview scheduling and completion metrics (PDF)',
    icon: Calendar,
    color: 'bg-primary/15 text-primary',
    defaultFormat: 'pdf' as ReportFormat,
    allowedFormats: ['pdf'] as ReportFormat[]
  },
  {
    id: 'performance' as ReportType,
    title: 'Recruitment Performance',
    description: 'Team performance and KPI metrics (PDF)',
    icon: ChartBar,
    color: 'bg-warning/20 text-warning',
    defaultFormat: 'pdf' as ReportFormat,
    allowedFormats: ['pdf'] as ReportFormat[]
  }
]

const fallbackReportType: ReportType = 'applications'

function isReportType(value: string): value is ReportType {
  return reportTypes.some((report) => report.id === value)
}

function getReportConfig(reportId: ReportType) {
  return reportTypes.find((report) => report.id === reportId) || reportTypes[0]
}

function toAllowedFormat(reportId: ReportType, format: string): ReportFormat {
  const config = getReportConfig(reportId)
  return config.allowedFormats.includes(format as ReportFormat)
    ? (format as ReportFormat)
    : config.defaultFormat
}

interface ReportsClientProps {
  org: string
  recruiterId: string
  recentReports: any[]
}

interface StatusPreview {
  reportType: ReportType
  total: number
  counts: Array<{
    label: string
    count: number
  }>
}

export function ReportsClient({ org, recruiterId, recentReports: initialRecentReports }: ReportsClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [recentReports, setRecentReports] = useState(initialRecentReports || [])
  const [recentReportsLoading, setRecentReportsLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [statusPreview, setStatusPreview] = useState<StatusPreview | null>(null)
  
  const [selectedType, setSelectedType] = useState<ReportType>('applications')
  const [selectedRange, setSelectedRange] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('csv')

  const parseSelectedRange = (value: string) => {
    if (value === 'all') {
      return 0
    }

    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  const loadStatusPreview = useCallback(async (
    reportType: ReportType,
    rangeValue: string,
    options?: { silent?: boolean }
  ) => {
    const { silent = false } = options || {}
    try {
      if (!silent) {
        setPreviewLoading(true)
      }
      const range = parseSelectedRange(rangeValue)
      const preview = await getReportStatusPreview(recruiterId, reportType, range)
      setStatusPreview(preview)
    } catch (err) {
      console.error('Failed to load report preview', err)
      setStatusPreview(null)
    } finally {
      if (!silent) {
        setPreviewLoading(false)
      }
    }
  }, [recruiterId])

  const refreshRecentReports = useCallback(async (options?: { silent?: boolean }) => {
    const { silent = false } = options || {}
    try {
      if (!silent) {
        setRecentReportsLoading(true)
      }
      const latestReports = await getRecentReports(recruiterId)
      setRecentReports(latestReports || [])
    } catch (err) {
      console.error('Failed to refresh recent reports', err)
      if (!silent) {
        toast.error('Failed to refresh report history')
      }
    } finally {
      if (!silent) {
        setRecentReportsLoading(false)
      }
    }
  }, [recruiterId])

  const handleRefreshData = async () => {
    await Promise.all([
      refreshRecentReports(),
      loadStatusPreview(selectedType, selectedRange),
    ])
    toast.success('Report data refreshed')
  }

  useEffect(() => {
    const coerced = toAllowedFormat(selectedType, selectedFormat)
    if (coerced !== selectedFormat) {
      setSelectedFormat(coerced)
    }
  }, [selectedType, selectedFormat])

  useEffect(() => {
    setRecentReports(initialRecentReports || [])
  }, [initialRecentReports])

  useEffect(() => {
    void loadStatusPreview(selectedType, selectedRange)
  }, [loadStatusPreview, selectedType, selectedRange])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void Promise.all([
        refreshRecentReports({ silent: true }),
        loadStatusPreview(selectedType, selectedRange, { silent: true }),
      ])
    }, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadStatusPreview, refreshRecentReports, selectedType, selectedRange])

  const downloadFileFromBase64 = (contentBase64: string, fileName: string, type: string) => {
    const binary = window.atob(contentBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const addReportToHistory = (type: string, format: string, fileName: string, dateRange: number) => {
    const newReport = {
      id: Date.now().toString(),
      report_type: type,
      format,
      file_name: fileName,
      date_range: dateRange,
      created_at: new Date().toISOString(),
    }
    setRecentReports((prev) => [newReport, ...prev].slice(0, 10))
  }

  const getLatestReportForType = (reportType: ReportType) => {
    return recentReports
      .filter((item) => item?.report_type === reportType)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

  const generateReportByType = async (
    reportId: ReportType,
    days: number,
    requestedFormat: ReportFormat,
    options?: {
      showSuccessToast?: boolean
      showErrorToast?: boolean
    }
  ) => {
    const { showSuccessToast = true, showErrorToast = true } = options || {}
    const parsedDays = Number(days)
    const range = Number.isFinite(parsedDays) ? Math.max(0, Math.floor(parsedDays)) : 0
    const format = toAllowedFormat(reportId, requestedFormat)

    if (reportId === 'applications') {
      const reportFile = await generateApplicationsReportFile(recruiterId, range)
      if (!reportFile) {
        if (showErrorToast) {
          toast.error('Failed to generate applications report.')
        }
        return false
      }

      downloadFileFromBase64(reportFile.contentBase64, reportFile.fileName, reportFile.mimeType)
      addReportToHistory(reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      const logged = await logGeneratedReport(recruiterId, reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      if (showSuccessToast) {
        toast.success('Applications report downloaded')
      }
      if (!logged) {
        toast.info('Report downloaded, but history could not be saved.')
      }
      return true
    }

    if (reportId === 'candidates') {
      const reportFile = await generateCandidatesReportFile(recruiterId, range, format === 'csv' ? 'csv' : 'excel')
      if (!reportFile) {
        if (showErrorToast) {
          toast.error('Failed to generate candidate report.')
        }
        return false
      }

      downloadFileFromBase64(reportFile.contentBase64, reportFile.fileName, reportFile.mimeType)
      addReportToHistory(reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      const logged = await logGeneratedReport(recruiterId, reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      if (showSuccessToast) {
        toast.success('Candidate report downloaded')
      }
      if (!logged) {
        toast.info('Report downloaded, but history could not be saved.')
      }
      return true
    }

    if (reportId === 'interviews') {
      const reportFile = await generateInterviewsPDFReportFile(recruiterId, range)
      if (!reportFile) {
        if (showErrorToast) {
          toast.error('Failed to generate interview report.')
        }
        return false
      }

      downloadFileFromBase64(reportFile.contentBase64, reportFile.fileName, reportFile.mimeType)
      addReportToHistory(reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      const logged = await logGeneratedReport(recruiterId, reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
      if (showSuccessToast) {
        toast.success('Interview analytics report downloaded')
      }
      if (!logged) {
        toast.info('Report downloaded, but history could not be saved.')
      }
      return true
    }

    const reportFile = await generatePerformancePDFReportFile(recruiterId, range)
    if (!reportFile) {
      if (showErrorToast) {
        toast.error('Failed to generate performance report')
      }
      return false
    }

    downloadFileFromBase64(reportFile.contentBase64, reportFile.fileName, reportFile.mimeType)
    addReportToHistory(reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
    const logged = await logGeneratedReport(recruiterId, reportFile.reportType, reportFile.format, reportFile.fileName, reportFile.dateRange)
    if (showSuccessToast) {
      toast.success('Performance report downloaded')
    }
    if (!logged) {
      toast.info('Report downloaded, but history could not be saved.')
    }
    return true
  }

  const generateReport = async (reportId: ReportType, days: number, requestedFormat: ReportFormat) => {
    try {
      setLoading(reportId)
      const success = await generateReportByType(reportId, days, requestedFormat)
      if (success) {
        await Promise.all([
          refreshRecentReports({ silent: true }),
          loadStatusPreview(selectedType, selectedRange, { silent: true }),
        ])
      }
    } catch (err) {
      console.error(err)
      toast.error('Error generating report')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerate = async (reportId: ReportType, isQuickGenerate = false) => {
    const config = getReportConfig(reportId)
    const range = isQuickGenerate ? parseSelectedRange(selectedRange) : 30
    const format = isQuickGenerate ? selectedFormat : config.defaultFormat
    await generateReport(reportId, range, format)
  }

  const handleRegenerateFromHistory = async (report: any) => {
    const reportType = isReportType(report?.report_type) ? report.report_type : fallbackReportType
    const reportDays = Number(report?.date_range)
    const range = Number.isFinite(reportDays) ? Math.max(0, Math.floor(reportDays)) : 0
    const format = toAllowedFormat(reportType, report?.format || getReportConfig(reportType).defaultFormat)
    await generateReport(reportType, range, format)
  }

  const handleDownloadLastGenerated = async (reportId: ReportType) => {
    const lastReport = getLatestReportForType(reportId)
    if (!lastReport) {
      toast.info('No previously generated report found for this type.')
      return
    }

    const reportType = isReportType(lastReport.report_type) ? lastReport.report_type : reportId
    const parsedRange = Number(lastReport.date_range)
    const range = Number.isFinite(parsedRange) ? Math.max(0, Math.floor(parsedRange)) : 0
    const format = toAllowedFormat(reportType, String(lastReport.format || getReportConfig(reportType).defaultFormat))
    await generateReport(reportType, range, format)
  }

  const handleExportAllReports = async () => {
    const range = parseSelectedRange(selectedRange)
    const reportOrder: ReportType[] = ['applications', 'candidates', 'interviews', 'performance']
    let successCount = 0

    try {
      setLoading('all')

      for (const reportId of reportOrder) {
        const config = getReportConfig(reportId)
        const preferredFormat = reportId === selectedType ? selectedFormat : config.defaultFormat
        const success = await generateReportByType(reportId, range, preferredFormat, {
          showSuccessToast: false,
          showErrorToast: true,
        })
        if (success) {
          successCount += 1
        }
      }

      if (successCount === reportOrder.length) {
        toast.success('All reports exported successfully')
      } else if (successCount > 0) {
        toast.warning(`${successCount} of ${reportOrder.length} reports exported. Check errors for failed reports.`)
      } else {
        toast.error('No reports were exported.')
      }

      await Promise.all([
        refreshRecentReports({ silent: true }),
        loadStatusPreview(selectedType, selectedRange, { silent: true }),
      ])
    } catch (err) {
      console.error(err)
      toast.error('Error exporting all reports')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Report Generation</CardTitle>
          <CardDescription>Generate a report with custom parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="candidates">Candidate Pipeline</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="performance">Performance Tracker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={selectedRange} onValueChange={setSelectedRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ReportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv" disabled={!getReportConfig(selectedType).allowedFormats.includes('csv')}>CSV</SelectItem>
                  <SelectItem value="excel" disabled={!getReportConfig(selectedType).allowedFormats.includes('excel')}>Excel</SelectItem>
                  <SelectItem value="pdf" disabled={!getReportConfig(selectedType).allowedFormats.includes('pdf')}>PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {getReportConfig(selectedType).title} supports {getReportConfig(selectedType).allowedFormats.join(', ').toUpperCase()} format.
          </p>

          <div className="rounded-md border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview Metrics</p>
              {previewLoading && <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {statusPreview && statusPreview.counts.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Total records {parseSelectedRange(selectedRange) === 0 ? 'across all time' : 'in selected range'}: {statusPreview.total}
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusPreview.counts.map((item) => (
                    <span key={item.label} className="rounded-full border px-2 py-1 text-xs font-medium bg-background">
                      {item.label}: {item.count}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No preview data available for this range.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Button 
              className="w-full gap-2" 
              onClick={() => handleGenerate(selectedType, true)}
              disabled={loading !== null}
            >
              {loading === selectedType ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Generate & Download Report
            </Button>
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={handleExportAllReports}
              disabled={loading !== null}
            >
              {loading === 'all' ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export All Reports
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleRefreshData}
            disabled={loading !== null || previewLoading || recentReportsLoading}
          >
            {(previewLoading || recentReportsLoading) ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Live Data
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => {
          const Icon = report.icon
          const lastGenerated = getLatestReportForType(report.id)
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`p-3 rounded-lg ${report.color} w-fit mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => handleGenerate(report.id, false)}
                  disabled={loading !== null}
                >
                  {loading === report.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Default
                </Button>

                <Button
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={() => handleDownloadLastGenerated(report.id)}
                  disabled={loading !== null || !lastGenerated}
                >
                  {loading === report.id ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Last Generated
                </Button>

                {lastGenerated ? (
                  <p className="text-xs text-muted-foreground">
                    Last generated {formatDateUTC(lastGenerated.created_at)} ({String(lastGenerated.format).toUpperCase()})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No generated file yet.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium text-muted-foreground">No history available</p>
                  <p className="text-xs text-muted-foreground">Generated reports will appear here.</p>
                </div>
              </div>
            ) : (
              recentReports.map((report, idx) => (
                <div key={report.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10">
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm capitalize">{report.report_type} Report</p>
                      <p className="text-xs text-muted-foreground">{report.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded uppercase">
                      {report.format}
                    </span>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {formatDateUTC(report.created_at)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateFromHistory(report)}
                      disabled={loading !== null}
                    >
                      {loading === report.report_type ? 'Generating...' : 'Generate Again'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
