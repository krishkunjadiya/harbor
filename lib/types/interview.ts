export type InterviewDifficulty = 'easy' | 'medium' | 'hard'

export interface InterviewQuestion {
  id: string
  text: string
  category: string
  difficulty: InterviewDifficulty
  role_tags: string[] | null
  company_tags: string[] | null
}

export interface InterviewEvaluation {
  score: number
  strengths: string[]
  weaknesses: string[]
  improvedAnswer: string
}

export interface MockInterviewAnswer {
  questionId: string
  question: string
  answer: string
  feedback: InterviewEvaluation
  answeredAt: string
}

export interface RecentMockSession {
  id: string
  role: string
  date: string
  score: number
  questionCount: number
}

export interface InterviewRoleDetection {
  role: string
  prioritizedSkills: string[]
  sources: string[]
}

export interface QuestionBankFilters {
  search: string
  category: string
  difficulty: 'all' | InterviewDifficulty
  role: string
}

export interface QuestionBankQuestion extends InterviewQuestion {
  bookmarked: boolean
  practiced: boolean
  lastScore: number | null
  lastPracticedAt: string | null
}

export interface QuestionBankFilterOptions {
  categories: string[]
  roles: string[]
  difficulties: Array<'easy' | 'medium' | 'hard'>
}

export interface PerformanceWeakTopic {
  category: string
  attempts: number
  averageScore: number
}

export interface PerformanceRecentActivity {
  id: string
  type: 'session' | 'practice'
  title: string
  description: string
  date: string
  score: number | null
}

export interface PerformanceScoreTrendPoint {
  label: string
  score: number
}

export interface PerformanceTrackerData {
  totalSessions: number
  averageScore: number
  totalPracticedQuestions: number
  weakTopics: PerformanceWeakTopic[]
  recentActivity: PerformanceRecentActivity[]
  scoreTrend: PerformanceScoreTrendPoint[]
}

export interface PrepCard {
  id: string
  topic: string
  question: string
  difficulty: InterviewDifficulty
  roleTags: string[]
  quickStructure: string[]
}

export interface PrepCardTopicGroup {
  topic: string
  cards: PrepCard[]
}

export interface InterviewResourceLink {
  label: string
  url: string
}

export interface InterviewResourceSection {
  id: string
  title: string
  description: string
  items: string[]
  links: InterviewResourceLink[]
}
