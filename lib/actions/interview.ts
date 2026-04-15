'use server'

import path from 'path'
import { readFile } from 'fs/promises'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/cached'
import type {
  InterviewQuestion,
  MockInterviewAnswer,
  InterviewRoleDetection,
  RecentMockSession,
  QuestionBankFilterOptions,
  QuestionBankFilters,
  QuestionBankQuestion,
  PerformanceTrackerData,
  PerformanceRecentActivity,
  PrepCardTopicGroup,
  InterviewResourceSection,
} from '@/lib/types/interview'

type StudentInterviewRow = {
  major: string | null
  program: string | null
  skills: string[] | null
  resume_feedback: {
    found_keywords?: string[]
  } | null
}

const ROLE_KEYWORDS: Array<{ role: string; keywords: string[] }> = [
  {
    role: 'frontend developer',
    keywords: ['react', 'next.js', 'nextjs', 'css', 'html', 'frontend', 'typescript', 'ui', 'ux'],
  },
  {
    role: 'backend developer',
    keywords: ['node', 'api', 'backend', 'sql', 'database', 'microservice', 'auth', 'express'],
  },
  {
    role: 'full stack developer',
    keywords: ['full stack', 'fullstack', 'react', 'node', 'api', 'frontend', 'backend'],
  },
  {
    role: 'data scientist',
    keywords: ['python', 'machine learning', 'ml', 'statistics', 'pandas', 'data science', 'model'],
  },
  {
    role: 'devops engineer',
    keywords: ['docker', 'kubernetes', 'terraform', 'devops', 'ci/cd', 'aws', 'azure', 'gcp'],
  },
]

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function normalizeRole(role: string): string {
  return role.trim().toLowerCase()
}

function normalizeFilterValue(value: string): string {
  const normalized = value.trim().toLowerCase()
  return normalized === 'all' ? '' : normalized
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function inferRole(signals: string[]): string {
  const normalized = signals.map((signal) => signal.toLowerCase())
  let bestRole = 'software engineer'
  let bestScore = 0

  for (const candidate of ROLE_KEYWORDS) {
    const score = candidate.keywords.reduce((acc, keyword) => {
      const matched = normalized.some((signal) => signal.includes(keyword))
      return acc + (matched ? 1 : 0)
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestRole = candidate.role
    }
  }

  return bestRole
}

function rankQuestionsBySkills(questions: InterviewQuestion[], prioritizedSkills: string[]): InterviewQuestion[] {
  if (prioritizedSkills.length === 0) {
    return questions
  }

  const loweredSkills = prioritizedSkills.map((skill) => skill.toLowerCase())

  return [...questions].sort((a, b) => {
    const aText = `${a.text} ${a.category} ${(a.role_tags || []).join(' ')}`.toLowerCase()
    const bText = `${b.text} ${b.category} ${(b.role_tags || []).join(' ')}`.toLowerCase()

    const aScore = loweredSkills.reduce((score, skill) => score + (aText.includes(skill) ? 1 : 0), 0)
    const bScore = loweredSkills.reduce((score, skill) => score + (bText.includes(skill) ? 1 : 0), 0)

    return bScore - aScore
  })
}

function buildQuickStructure(category: string, difficulty: InterviewQuestion['difficulty']): string[] {
  const normalizedCategory = category.trim().toLowerCase()

  if (normalizedCategory.includes('behavior')) {
    return [
      'Situation: set context in one line.',
      'Action: explain what you did and why.',
      'Result: quantify impact and learning.',
    ]
  }

  if (normalizedCategory.includes('frontend')) {
    return [
      'State assumptions and UI constraints.',
      'Explain component/data flow decisions.',
      'Mention performance + accessibility checks.',
    ]
  }

  if (normalizedCategory.includes('backend')) {
    return [
      'Define API/data requirements first.',
      'Describe architecture + trade-offs.',
      'Cover security, scalability, and observability.',
    ]
  }

  if (normalizedCategory.includes('devops')) {
    return [
      'Describe deployment/runtime context.',
      'Explain reliability and rollback plan.',
      'Include monitoring and incident response.',
    ]
  }

  if (normalizedCategory.includes('data')) {
    return [
      'State objective and evaluation metric.',
      'Describe data/feature or model choice.',
      'Explain validation and business impact.',
    ]
  }

  if (difficulty === 'hard') {
    return [
      'Frame constraints and edge cases upfront.',
      'Compare at least two solution options.',
      'Conclude with trade-offs and validation plan.',
    ]
  }

  return [
    'Clarify the problem and assumptions.',
    'Provide a structured solution approach.',
    'End with validation or measurable outcomes.',
  ]
}

export async function detectInterviewRoleForCurrentStudent(): Promise<InterviewRoleDetection | null> {
  const profile = await getCurrentProfile()

  if (!profile || profile.user_type !== 'student') {
    return null
  }

  const supabase = await createClient()

  const [{ data: studentRow }, { data: userSkillsRows }] = await Promise.all([
    supabase
      .from('students')
      .select('major, program, skills, resume_feedback')
      .eq('profile_id', profile.id)
      .single(),
    supabase
      .from('user_skills')
      .select('skill_name')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const typedStudent = (studentRow || null) as StudentInterviewRow | null
  const major = typedStudent?.major || ''
  const program = typedStudent?.program || ''
  const studentSkills = typedStudent?.skills || []
  const resumeKeywords = typedStudent?.resume_feedback?.found_keywords || []
  const userSkills = (userSkillsRows || []).map((row: { skill_name: string }) => row.skill_name)

  const signals = dedupe([
    major,
    program,
    ...studentSkills,
    ...resumeKeywords,
    ...userSkills,
  ])

  const role = inferRole(signals)

  const sources = dedupe([
    major ? 'major' : '',
    program ? 'program' : '',
    studentSkills.length > 0 ? 'student_skills' : '',
    resumeKeywords.length > 0 ? 'resume_feedback' : '',
    userSkills.length > 0 ? 'user_skills' : '',
  ])

  return {
    role,
    prioritizedSkills: signals.slice(0, 12),
    sources,
  }
}

export async function getMockInterviewQuestions(input: {
  role: string
  count: number
  prioritizedSkills?: string[]
}): Promise<InterviewQuestion[]> {
  const supabase = await createClient()
  const requestedCount = Math.min(10, Math.max(5, input.count))
  const normalizedRole = normalizeRole(input.role)

  const { data: roleMatchedRows, error: roleError } = await supabase
    .from('questions')
    .select('id, text, category, difficulty, role_tags, company_tags')
    .overlaps('role_tags', [normalizedRole])
    .limit(40)

  if (roleError) {
    console.error('[interview] failed to fetch role-matched questions:', roleError)
  }

  let questions = (roleMatchedRows || []) as InterviewQuestion[]

  if (questions.length < requestedCount) {
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from('questions')
      .select('id, text, category, difficulty, role_tags, company_tags')
      .limit(100)

    if (fallbackError) {
      console.error('[interview] failed to fetch fallback questions:', fallbackError)
    } else {
      const merged = new Map<string, InterviewQuestion>()
      for (const question of questions) {
        merged.set(question.id, question)
      }
      for (const question of (fallbackRows || []) as InterviewQuestion[]) {
        merged.set(question.id, question)
      }
      questions = [...merged.values()]
    }
  }

  const ranked = rankQuestionsBySkills(questions, input.prioritizedSkills || [])
  return ranked.slice(0, requestedCount)
}

export async function saveMockInterviewSession(input: {
  role: string
  questions: InterviewQuestion[]
  answers: MockInterviewAnswer[]
}): Promise<{ id: string; score: number }> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  const validScores = input.answers
    .map((entry) => Number(entry.feedback.score))
    .filter((score) => Number.isFinite(score))
    .map((score) => Math.max(0, Math.min(10, score)))

  const average =
    validScores.length > 0
      ? Number((validScores.reduce((acc, score) => acc + score, 0) / validScores.length).toFixed(2))
      : 0

  const payload = {
    student_id: profile.id,
    role: input.role,
    date: new Date().toISOString(),
    score: average,
    questions_json: input.questions,
    answers_json: input.answers,
  }

  const { data, error } = await supabase
    .from('mock_sessions')
    .insert(payload)
    .select('id, score')
    .single()

  if (error || !data) {
    console.error('[interview] failed to save mock session:', error)
    throw new Error('Failed to save session')
  }

  const practicedRows = input.answers
    .map((answer) => ({
      student_id: profile.id,
      question_id: answer.questionId,
      last_score: Math.max(0, Math.min(10, Number(answer.feedback.score) || 0)),
      last_practiced_at: answer.answeredAt,
    }))
    .filter((row) => isUuid(row.question_id))

  if (practicedRows.length > 0) {
    const { error: practicedError } = await supabase
      .from('practiced')
      .upsert(practicedRows, { onConflict: 'student_id,question_id' })

    if (practicedError) {
      console.error('[interview] failed to upsert practiced rows:', practicedError)
    }
  }

  return {
    id: data.id,
    score: Number(data.score) || average,
  }
}

export async function getRecentMockSessions(limit = 5): Promise<RecentMockSession[]> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    return []
  }

  const supabase = await createClient()
  const safeLimit = Math.min(20, Math.max(1, limit))

  const { data, error } = await supabase
    .from('mock_sessions')
    .select('id, role, date, score, answers_json')
    .eq('student_id', profile.id)
    .order('date', { ascending: false })
    .limit(safeLimit)

  if (error) {
    console.error('[interview] failed to fetch recent sessions:', error)
    return []
  }

  return (data || []).map((row: { id: string; role: string; date: string; score: number; answers_json: unknown[] }) => ({
    id: row.id,
    role: row.role,
    date: row.date,
    score: Number(row.score) || 0,
    questionCount: Array.isArray(row.answers_json) ? row.answers_json.length : 0,
  }))
}

export async function getQuestionBankFilterOptions(): Promise<QuestionBankFilterOptions> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('questions')
    .select('category, role_tags')
    .limit(500)

  if (error) {
    console.error('[interview] failed to fetch question bank filter options:', error)
    return {
      categories: [],
      roles: [],
      difficulties: ['easy', 'medium', 'hard'],
    }
  }

  const categories = new Set<string>()
  const roles = new Set<string>()

  for (const row of data || []) {
    if (row.category) {
      categories.add(row.category)
    }

    const roleTags = Array.isArray(row.role_tags) ? row.role_tags : []
    for (const roleTag of roleTags) {
      if (roleTag) {
        roles.add(String(roleTag))
      }
    }
  }

  return {
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    roles: [...roles].sort((a, b) => a.localeCompare(b)),
    difficulties: ['easy', 'medium', 'hard'],
  }
}

export async function getQuestionBankQuestions(input?: Partial<QuestionBankFilters>): Promise<QuestionBankQuestion[]> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    return []
  }

  const supabase = await createClient()

  const search = (input?.search || '').trim()
  const category = normalizeFilterValue(input?.category || '')
  const difficulty = normalizeFilterValue(input?.difficulty || '')
  const role = normalizeFilterValue(input?.role || '')

  let query = supabase
    .from('questions')
    .select('id, text, category, difficulty, role_tags, company_tags')
    .order('category', { ascending: true })
    .order('difficulty', { ascending: true })
    .limit(200)

  if (search) {
    const safeSearch = search.replace(/,/g, ' ').replace(/[%_]/g, '')
    query = query.or(`text.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty)
  }

  if (role) {
    query = query.overlaps('role_tags', [role])
  }

  const { data: questions, error: questionsError } = await query

  if (questionsError) {
    console.error('[interview] failed to fetch question bank questions:', questionsError)
    return []
  }

  const questionRows = (questions || []) as InterviewQuestion[]
  const questionIds = questionRows.map((row) => row.id)

  if (questionIds.length === 0) {
    return []
  }

  const [{ data: bookmarkRows }, { data: practicedRows }] = await Promise.all([
    supabase
      .from('bookmarks')
      .select('question_id')
      .eq('student_id', profile.id)
      .in('question_id', questionIds),
    supabase
      .from('practiced')
      .select('question_id, last_score, last_practiced_at')
      .eq('student_id', profile.id)
      .in('question_id', questionIds),
  ])

  const bookmarkedIds = new Set((bookmarkRows || []).map((row: { question_id: string }) => row.question_id))
  const practicedMap = new Map(
    (practicedRows || []).map((row: { question_id: string; last_score: number; last_practiced_at: string | null }) => [
      row.question_id,
      row,
    ])
  )

  return questionRows.map((question) => {
    const practiced = practicedMap.get(question.id)
    return {
      ...question,
      bookmarked: bookmarkedIds.has(question.id),
      practiced: Boolean(practiced),
      lastScore: practiced ? Number(practiced.last_score) : null,
      lastPracticedAt: practiced?.last_practiced_at || null,
    }
  })
}

export async function toggleQuestionBookmark(questionId: string, shouldBookmark: boolean): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    throw new Error('Unauthorized')
  }

  if (!isUuid(questionId)) {
    throw new Error('Invalid question id')
  }

  const supabase = await createClient()

  if (shouldBookmark) {
    const { error } = await supabase
      .from('bookmarks')
      .upsert(
        {
          student_id: profile.id,
          question_id: questionId,
        },
        { onConflict: 'student_id,question_id' }
      )

    if (error) {
      console.error('[interview] failed to bookmark question:', error)
      throw new Error('Could not bookmark question')
    }

    return true
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .match({ student_id: profile.id, question_id: questionId })

  if (error) {
    console.error('[interview] failed to remove bookmark:', error)
    throw new Error('Could not remove bookmark')
  }

  return true
}

export async function markQuestionAsPracticed(questionId: string, score = 7): Promise<boolean> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    throw new Error('Unauthorized')
  }

  if (!isUuid(questionId)) {
    throw new Error('Invalid question id')
  }

  const normalizedScore = Math.max(0, Math.min(10, Number(score) || 0))
  const supabase = await createClient()

  const { error } = await supabase
    .from('practiced')
    .upsert(
      {
        student_id: profile.id,
        question_id: questionId,
        last_score: normalizedScore,
        last_practiced_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,question_id' }
    )

  if (error) {
    console.error('[interview] failed to mark question as practiced:', error)
    throw new Error('Could not mark question as practiced')
  }

  return true
}

export async function getPerformanceTrackerData(): Promise<PerformanceTrackerData> {
  const empty: PerformanceTrackerData = {
    totalSessions: 0,
    averageScore: 0,
    totalPracticedQuestions: 0,
    weakTopics: [],
    recentActivity: [],
    scoreTrend: [],
  }

  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    return empty
  }

  const supabase = await createClient()

  const [{ data: sessionRows, error: sessionError }, { data: practicedRows, error: practicedError }] = await Promise.all([
    supabase
      .from('mock_sessions')
      .select('id, role, date, score, answers_json')
      .eq('student_id', profile.id)
      .order('date', { ascending: false })
      .limit(100),
    supabase
      .from('practiced')
      .select('question_id, last_score, last_practiced_at')
      .eq('student_id', profile.id)
      .order('last_practiced_at', { ascending: false })
      .limit(400),
  ])

  if (sessionError) {
    console.error('[interview] failed to fetch performance sessions:', sessionError)
  }
  if (practicedError) {
    console.error('[interview] failed to fetch practiced records:', practicedError)
  }

  const sessions = (sessionRows || []) as Array<{
    id: string
    role: string
    date: string
    score: number
    answers_json: unknown[]
  }>

  const practiced = (practicedRows || []) as Array<{
    question_id: string
    last_score: number
    last_practiced_at: string | null
  }>

  const totalSessions = sessions.length
  const averageScore =
    totalSessions > 0
      ? Number((sessions.reduce((sum, row) => sum + (Number(row.score) || 0), 0) / totalSessions).toFixed(2))
      : 0

  const totalPracticedQuestions = practiced.length
  const questionIds = practiced.map((row) => row.question_id).filter((id) => isUuid(id))

  let categoryByQuestionId = new Map<string, string>()
  if (questionIds.length > 0) {
    const { data: questionRows, error: questionError } = await supabase
      .from('questions')
      .select('id, category')
      .in('id', questionIds)

    if (questionError) {
      console.error('[interview] failed to map question categories for performance:', questionError)
    } else {
      categoryByQuestionId = new Map(
        (questionRows || []).map((row: { id: string; category: string | null }) => [
          row.id,
          row.category || 'general',
        ])
      )
    }
  }

  const topicStats = new Map<string, { attempts: number; scoreTotal: number }>()
  for (const row of practiced) {
    const category = categoryByQuestionId.get(row.question_id) || 'general'
    const current = topicStats.get(category) || { attempts: 0, scoreTotal: 0 }
    current.attempts += 1
    current.scoreTotal += Number(row.last_score) || 0
    topicStats.set(category, current)
  }

  const weakTopics = [...topicStats.entries()]
    .map(([category, stats]) => ({
      category,
      attempts: stats.attempts,
      averageScore: Number((stats.scoreTotal / Math.max(stats.attempts, 1)).toFixed(2)),
    }))
    .sort((a, b) => {
      if (a.averageScore !== b.averageScore) {
        return a.averageScore - b.averageScore
      }
      return b.attempts - a.attempts
    })
    .slice(0, 5)

  const sessionActivity: PerformanceRecentActivity[] = sessions.map((row) => ({
    id: `session-${row.id}`,
    type: 'session',
    title: 'Completed mock interview',
    description: `${row.role} • ${Array.isArray(row.answers_json) ? row.answers_json.length : 0} questions`,
    date: row.date,
    score: Number(row.score) || 0,
  }))

  const practiceActivity: PerformanceRecentActivity[] = practiced.map((row) => ({
    id: `practice-${row.question_id}`,
    type: 'practice',
    title: 'Practiced question',
    description: `${categoryByQuestionId.get(row.question_id) || 'general'} topic`,
    date: row.last_practiced_at || new Date(0).toISOString(),
    score: Number(row.last_score) || 0,
  }))

  const recentActivity = [...sessionActivity, ...practiceActivity]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12)

  const scoreTrend = [...sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-8)
    .map((row) => ({
      label: new Date(row.date).toLocaleDateString(),
      score: Number(row.score) || 0,
    }))

  return {
    totalSessions,
    averageScore,
    totalPracticedQuestions,
    weakTopics,
    recentActivity,
    scoreTrend,
  }
}

export async function getPrepCardsByTopic(limitPerTopic = 8): Promise<PrepCardTopicGroup[]> {
  const profile = await getCurrentProfile()
  if (!profile || profile.user_type !== 'student') {
    return []
  }

  const supabase = await createClient()
  const safeLimitPerTopic = Math.min(12, Math.max(4, limitPerTopic))

  const { data, error } = await supabase
    .from('questions')
    .select('id, text, category, difficulty, role_tags')
    .order('category', { ascending: true })
    .order('difficulty', { ascending: true })
    .limit(500)

  if (error) {
    console.error('[interview] failed to fetch prep cards:', error)
    return []
  }

  const grouped = new Map<string, Array<{ id: string; text: string; category: string; difficulty: InterviewQuestion['difficulty']; role_tags: string[] | null }>>()

  for (const row of data || []) {
    const topic = row.category || 'general'
    if (!grouped.has(topic)) {
      grouped.set(topic, [])
    }
    grouped.get(topic)?.push({
      id: row.id,
      text: row.text,
      category: topic,
      difficulty: row.difficulty,
      role_tags: Array.isArray(row.role_tags) ? row.role_tags : [],
    })
  }

  return [...grouped.entries()]
    .map(([topic, rows]) => ({
      topic,
      cards: rows.slice(0, safeLimitPerTopic).map((row) => ({
        id: row.id,
        topic,
        question: row.text,
        difficulty: row.difficulty,
        roleTags: (row.role_tags || []).slice(0, 5),
        quickStructure: buildQuickStructure(topic, row.difficulty),
      })),
    }))
    .filter((group) => group.cards.length > 0)
}

function isResourceSection(value: any): value is InterviewResourceSection {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    Array.isArray(value.items) &&
    value.items.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(value.links) &&
    value.links.every((link: any) => link && typeof link.label === 'string' && typeof link.url === 'string')
  )
}

export async function getInterviewResourcesContent(): Promise<InterviewResourceSection[]> {
  const filePath = path.join(
    process.cwd(),
    'app',
    '(student)',
    'student',
    'interview-prep',
    'interview',
    'resources',
    'resources.json'
  )

  try {
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { sections?: unknown[] }
    const sections = Array.isArray(parsed.sections) ? parsed.sections.filter(isResourceSection) : []
    return sections
  } catch (error) {
    console.error('[interview] failed to load resources content:', error)
    return []
  }
}
