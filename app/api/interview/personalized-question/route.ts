import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'

type PersonalizedBody = {
  role?: string
  skills?: string[]
}

function buildFallbackQuestion(role: string, skills: string[]): string {
  const primarySkills = skills.slice(0, 3)

  if (primarySkills.length > 0) {
    return `As a ${role}, describe a real project where you used ${primarySkills.join(', ')} to solve a meaningful problem. What trade-offs did you make and what measurable impact did it create?`
  }

  return `As a ${role}, walk through one challenging project end-to-end: how you defined requirements, chose your approach, handled trade-offs, and validated outcomes in production.`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as PersonalizedBody
    const role = body.role?.trim() || 'software engineer'
    const skills = Array.isArray(body.skills)
      ? body.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 8)
      : []

    const response = await fetch(`${PYTHON_WORKER_URL}/generate-personalized-interview-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, skills }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[interview:personalized-question] worker error:', response.status, errorText)
      return NextResponse.json({
        question: buildFallbackQuestion(role, skills),
        role,
        skills,
        source: 'fallback',
      })
    }

    const payload = await response.json()
    const question = String(payload?.question || '').trim()

    if (!question) {
      return NextResponse.json({
        question: buildFallbackQuestion(role, skills),
        role,
        skills,
        source: 'fallback',
      })
    }

    return NextResponse.json({ question, role, skills, source: 'ai' })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.code === 'ECONNREFUSED') {
      const body = (await request.json().catch(() => ({}))) as PersonalizedBody
      const role = body.role?.trim() || 'software engineer'
      const skills = Array.isArray(body.skills)
        ? body.skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 8)
        : []

      return NextResponse.json({
        question: buildFallbackQuestion(role, skills),
        role,
        skills,
        source: 'fallback',
      })
    }

    console.error('[interview:personalized-question] unexpected error:', error)
    return NextResponse.json({ error: 'Failed to generate personalized question' }, { status: 500 })
  }
}
