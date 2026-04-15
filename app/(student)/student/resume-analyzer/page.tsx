"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, UploadSimple, CheckCircle, WarningCircle, TrendUp, Sparkle, Crosshair as TargetIcon } from "@phosphor-icons/react/dist/ssr"
import { uploadResume } from "@/lib/actions/storage"
import { updateStudentProfile, triggerDocumentParser } from "@/lib/actions/mutations"
import { useAuth } from "@/lib/auth/auth-provider"
import { getStudentProfile } from "@/lib/actions/database"
import { toast } from "sonner"

// Renders a line of AI text: **Title**: desc → <strong>Title</strong>: desc, strips leftover **
function renderMarkdownLine(text: string): React.ReactNode {
  const boldTitleMatch = text.match(/^\*\*(.+?)\*\*:\s*([\s\S]+)/)
  if (boldTitleMatch) {
    return <><strong>{boldTitleMatch[1]}</strong>: {boldTitleMatch[2].replace(/\*\*/g, '').replace(/\*/g, '')}</>
  }
  return text.replace(/\*\*/g, '').replace(/\*/g, '').trim()
}

export default function ResumeAnalyzerPage() {
  const { user } = useAuth()
  const [hasResume, setHasResume] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [resumeScore, setResumeScore] = useState<number | null>(null)
  const [resumeFeedback, setResumeFeedback] = useState<any>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [examplesDialogOpen, setExamplesDialogOpen] = useState(false)
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null)
  const [analysisTimedOut, setAnalysisTimedOut] = useState(false)
  const [retriggeringAnalysis, setRetriggeringAnalysis] = useState(false)
  const [pollCount, setPollCount] = useState(0)
  // pollingKey increments after an upload to restart the polling useEffect
  const [pollingKey, setPollingKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Track whether we have completed at least one successful fetch so tab-focus
  // re-runs never flash the full-page loading spinner.
  const hasLoadedRef = useRef(false)
  // Track the last pollingKey for which we showed the loading spinner, so a new
  // upload (pollingKey++) triggers the spinner but returning to the tab does not.
  const lastLoadedPollingKeyRef = useRef(-1)

  // Check if user has a resume; re-runs whenever user ID changes OR a new upload completes.
  // Using user?.id (stable string) instead of user (object) prevents the effect
  // from re-running every time the auth provider recreates the user object on tab focus.
  useEffect(() => {
    if (!user?.id) return
    const userId = user.id
    let timeoutId: NodeJS.Timeout
    let cancelled = false
    let polls = 0

    // Show the full-page spinner only when:
    //   a) This is the very first load (never fetched), OR
    //   b) A new upload happened (pollingKey incremented)
    // Tab focus / auth object recreation must NOT re-trigger the spinner.
    const isNewLoad = !hasLoadedRef.current || pollingKey > lastLoadedPollingKeyRef.current
    if (isNewLoad) {
      setLoading(true)
      lastLoadedPollingKeyRef.current = pollingKey
    }
    setAnalysisTimedOut(false)
    setPollCount(0)

    async function checkResume() {
      if (cancelled) return
      try {
        const profile = await getStudentProfile(userId)
        const studentData = profile?.students || {}
        if (cancelled) return

        setHasResume(!!studentData.resume_url)
        setResumeScore(studentData.resume_score || null)
        setResumeFeedback(studentData.resume_feedback || null)
        setLoading(false)
        hasLoadedRef.current = true

        // Poll every 5s while resume exists but AI hasn't returned feedback yet
        if (studentData.resume_url && !studentData.resume_feedback) {
          polls += 1
          setPollCount(polls)
          if (polls >= 24) {
            // ~2 minutes with no result → show error
            setAnalysisTimedOut(true)
          } else {
            timeoutId = setTimeout(checkResume, 5000)
          }
        }
      } catch (error) {
        console.error('Error checking resume:', error)
        if (!cancelled) setLoading(false)
      }
    }

    checkResume()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [user?.id, pollingKey])

  const handleRetriggerAnalysis = async () => {
    if (!user?.id) return
    const userId = user.id
    setRetriggeringAnalysis(true)
    try {
      const profile = await getStudentProfile(userId)
      const studentData = profile?.students || {}
      if (studentData.resume_url) {
        // Clear old (possibly mock) feedback so polling loop waits for fresh AI result
        await updateStudentProfile(userId, { resume_score: null, resume_feedback: null })
        setResumeScore(null)
        setResumeFeedback(null)
        // Restart polling loop BEFORE the slow AI call so UI shows "Analyzing..."
        setPollingKey(k => k + 1)
        await triggerDocumentParser(userId, studentData.resume_url, "")
      }
    } catch (err) {
      console.error('Retrigger failed:', err)
    } finally {
      setRetriggeringAnalysis(false)
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    setAppliedSuggestion(suggestion)
    toast.success('Suggestion saved for your next resume update')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    const userId = user.id

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB')
      return
    }

    if (!file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error('Invalid file type. Please upload PDF, DOC, or DOCX')
      return
    }

    setUploading(true)
    try {
      const result = await uploadResume(file, userId)
      
      if (result.success && result.url) {
        await updateStudentProfile(userId, {
          resume_url: result.url,
          resume_score: null,
          resume_feedback: null
        })
        await triggerDocumentParser(userId, result.url, result.path || "")

        setUploadDialogOpen(false)
        // Restart the polling loop — this automatically shows "Analyzing..." state
        setPollingKey(k => k + 1)
        toast.success('Resume uploaded successfully. Analysis started.')
      } else {
        toast.error('Upload failed: ' + result.error)
      }
    } catch (error) {
      toast.error('An error occurred while uploading: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const overallScore = Math.max(0, Math.min(100, Number(resumeScore) || 0))
  const scoreCircumference = 2 * Math.PI * 54
  const scoreOffset = scoreCircumference * (1 - overallScore / 100)
  const scoreStroke =
    overallScore >= 80 ? "var(--success)" : overallScore >= 60 ? "var(--warning)" : "var(--destructive)"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resume Analyzer</h1>
          <p className="text-muted-foreground">AI-powered insights to improve your resume</p>
        </div>
        <Button onClick={handleUploadClick}>
          <UploadSimple className="h-4 w-4 mr-2" />
          Upload New Resume
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="space-y-4 py-8">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid gap-3 md:grid-cols-3 pt-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : !hasResume ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Resume Uploaded</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload your resume to get AI-powered analysis and personalized recommendations
            </p>
            <Button size="lg" onClick={triggerFileInput} disabled={uploading}>
              <UploadSimple className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </p>
          </CardContent>
        </Card>
      ) : !resumeFeedback ? (
        <Card className={`border-2 ${analysisTimedOut ? 'border-destructive' : 'border-primary'}`}>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {analysisTimedOut ? (
              <>
                <WarningCircle className="h-16 w-16 text-destructive mb-6" />
                <h3 className="text-xl font-semibold mb-2">Analysis Taking Too Long</h3>
                <p className="text-muted-foreground mb-2 max-w-md">
                  The AI worker may not be running. Make sure the Python worker is started:
                </p>
                <code className="text-xs bg-muted px-3 py-2 rounded mb-6 text-left block max-w-sm">
                  cd python_worker<br />
                  uvicorn main:app --reload --port 8000
                </code>
                <div className="flex gap-3">
                  <Button onClick={handleRetriggerAnalysis} disabled={retriggeringAnalysis}>
                    {retriggeringAnalysis ? 'Retrying...' : 'Retry Analysis'}
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-full max-w-md space-y-3 mb-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analyzing Resume...</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Our AI is reading your resume and generating personalized feedback. This usually takes 10–30 seconds.
                </p>
                <p className="text-xs text-muted-foreground">
                  Check {pollCount} of 24 — polling every 5 seconds...
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Score */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-primary" />
                Overall Resume Score
              </CardTitle>
              <CardDescription>Based on AI analysis of content, format, and keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="relative h-32 w-32 shrink-0">
                  {/* SVG circular progress that fills based on real score */}
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted/30" />
                    <circle
                      cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={scoreCircumference}
                      strokeDashoffset={scoreOffset}
                      style={{ stroke: scoreStroke, transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={`text-4xl font-bold ${
                      overallScore >= 80 ? 'text-success' :
                      overallScore >= 60 ? 'text-warning' :
                      'text-destructive'
                    }`}>{overallScore}</div>
                    <div className="text-sm text-muted-foreground">/ 100</div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center text-success">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Content Quality</span>
                    </div>
                    <span className="font-bold text-lg">{resumeFeedback?.metrics?.content_quality || 0}/100</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                        <TargetIcon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Keyword Match</span>
                    </div>
                    <span className="font-bold text-lg">{resumeFeedback?.metrics?.keyword_match || 0}/100</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-info/15 flex items-center justify-center text-info">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Format & Structure</span>
                    </div>
                    <span className="font-bold text-lg">{resumeFeedback?.metrics?.format_structure || 0}/100</span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                        <Sparkle className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">ATS Compatibility</span>
                    </div>
                    <span className="font-bold text-lg">{resumeFeedback?.metrics?.ats_compatibility || 0}/100</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="strengths" className="space-y-4">
            <TabsList>
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="strengths" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    What's Working Well
                  </CardTitle>
                  <CardDescription>Strong points in your resume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeFeedback?.strengths?.map((strength: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 border border-success/30 bg-success/10 dark:bg-success/20 dark:border-success/40 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium mb-1">{renderMarkdownLine(strength)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="improvements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <WarningCircle className="h-5 w-5 text-warning" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>Recommendations to strengthen your resume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeFeedback?.improvements?.map((improvement: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 border border-warning/35 bg-warning/10 dark:bg-warning/20 dark:border-warning/45 rounded-lg">
                      <WarningCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium mb-1">{renderMarkdownLine(improvement)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Keywords Found
                    </CardTitle>
                    <CardDescription>Terms that match job descriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {resumeFeedback?.found_keywords?.map((keyword: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-success/15 text-success dark:bg-success/20 dark:text-success rounded-full text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <WarningCircle className="h-5 w-5 text-warning" />
                      Missing Keywords
                    </CardTitle>
                    <CardDescription>High-value terms to add</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {resumeFeedback?.missing_keywords?.map((keyword: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning rounded-full text-sm font-medium cursor-pointer hover:bg-warning/25 dark:hover:bg-warning/35 transition-colors">
                          + {keyword}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>How your resume scores across each dimension</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { category: "Content Quality", score: resumeFeedback?.metrics?.content_quality || 0 },
                    { category: "Keyword Match", score: resumeFeedback?.metrics?.keyword_match || 0 },
                    { category: "Format & Structure", score: resumeFeedback?.metrics?.format_structure || 0 },
                    { category: "ATS Compatibility", score: resumeFeedback?.metrics?.ats_compatibility || 0 },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-muted-foreground">{item.score} / 100</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            item.score >= 75 ? 'bg-success/100' :
                            item.score >= 60 ? 'bg-warning/100' : 'bg-destructive/100'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {appliedSuggestion && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-success font-medium">Suggestion queued for your next resume update.</p>
                    <p className="text-sm text-muted-foreground mt-1">{appliedSuggestion}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5 text-primary" />
                    Personalized Recommendations
                  </CardTitle>
                  <CardDescription>AI-generated suggestions based on your profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resumeFeedback?.suggestions?.map((suggestion: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 border rounded-lg">
                      <TargetIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{renderMarkdownLine(suggestion)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Next Steps</CardTitle>
                  <CardDescription>Focus areas based on your lowest scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Content Quality",    score: resumeFeedback?.metrics?.content_quality || 0,    action: "Improve content quality and descriptions" },
                    { label: "Keyword Match",       score: resumeFeedback?.metrics?.keyword_match || 0,       action: "Add missing keywords from job descriptions" },
                    { label: "Format & Structure",  score: resumeFeedback?.metrics?.format_structure || 0,   action: "Improve resume formatting and layout" },
                    { label: "ATS Compatibility",   score: resumeFeedback?.metrics?.ats_compatibility || 0,  action: "Optimise resume for ATS parsing" },
                  ]
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((item, i) => {
                      const gain = Math.round((100 - item.score) * 0.12)
                      return (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <span className="font-medium text-sm">{item.action}</span>
                              <p className="text-xs text-muted-foreground">{item.label}: {item.score}/100 — estimated +{gain} pts</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Upload your resume for AI-powered analysis and recommendations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={triggerFileInput}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              <UploadSimple className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Supported formats: PDF, DOC, DOCX (Max 10MB)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Examples Dialog */}
      <Dialog open={examplesDialogOpen} onOpenChange={setExamplesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resume Examples</DialogTitle>
            <DialogDescription>
              Professional resume templates and examples
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              View industry-standard resume examples for different roles:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Software Engineer Resume</li>
              <li>Data Scientist Resume</li>
              <li>Product Manager Resume</li>
              <li>UX Designer Resume</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setExamplesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

