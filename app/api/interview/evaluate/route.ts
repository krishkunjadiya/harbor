import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'

type EvaluateBody = {
  question?: string
  answer?: string
  role?: string
}

function coerceEvaluation(payload: any) {
  return {
    score: Math.max(0, Math.min(10, Number(payload?.score) || 0)),
    strengths: Array.isArray(payload?.strengths) ? payload.strengths.slice(0, 2).map(String) : [],
    weaknesses: Array.isArray(payload?.weaknesses) ? payload.weaknesses.slice(0, 2).map(String) : [],
    improvedAnswer: String(payload?.improved_answer || payload?.improvedAnswer || '').trim(),
  }
}

function buildPrompt(question: string, answer: string, role: string): string {
  return [
    `Question: ${question}`,
    `Student's answer: ${answer}`,
    `Role: ${role}`,
    '',
    'Evaluate this answer. Return JSON with:',
    '- score (out of 10)',
    '- strengths (2 points)',
    '- weaknesses (2 points)',
    '- improved answer (3 sentences)',
  ].join('\n')
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

    const body = (await request.json().catch(() => ({}))) as EvaluateBody
    const question = body.question?.trim() || ''
    const answer = body.answer?.trim() || ''
    const role = body.role?.trim() || 'software engineer'

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const prompt = buildPrompt(question, answer, role)

    const response = await fetch(`${PYTHON_WORKER_URL}/evaluate-interview-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, role, prompt }),
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[interview:evaluate] worker error:', response.status, errorText)
      return NextResponse.json(
        { error: `AI worker error: ${errorText}` },
        { status: response.status }
      )
    }

    const raw = await response.json()
    const evaluation = coerceEvaluation(raw)

    if (
      evaluation.strengths.length === 0 ||
      evaluation.weaknesses.length === 0 ||
      !evaluation.improvedAnswer
    ) {
      return NextResponse.json({ error: 'AI response format invalid' }, { status: 502 })
    }

    return NextResponse.json({ ...evaluation, prompt })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error:
            'AI worker is unavailable. Start it with: cd python_worker && uvicorn main:app --port 8000',
        },
        { status: 503 }
      )
    }

    console.error('[interview:evaluate] unexpected error:', error)
    return NextResponse.json({ error: 'Failed to evaluate answer' }, { status: 500 })
  }
}
