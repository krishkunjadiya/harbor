import { NextRequest, NextResponse } from 'next/server'

const PYTHON_WORKER_URL = process.env.PYTHON_WORKER_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, fileUrl, filePath, documentType } = body

    if (!studentId || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId and fileUrl' },
        { status: 400 }
      )
    }

    const response = await fetch(`${PYTHON_WORKER_URL}/analyze-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, fileUrl, filePath: filePath || '', documentType: documentType || 'resume' }),
      // Allow up to 60 seconds for AI analysis
      signal: AbortSignal.timeout(60_000) })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[analyze-resume] Python worker error:', response.status, errorText)
      return NextResponse.json(
        { error: `Worker error: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: any) {
    // If the Python worker isn't running, return a clear error
    if (error.code === 'ECONNREFUSED' || error.name === 'TimeoutError') {
      console.error('[analyze-resume] Python worker unreachable:', error.message)
      return NextResponse.json(
        {
          error: 'AI worker is not running. Start the Python worker with: cd python_worker && uvicorn main:app --port 8000',
          workerUrl: PYTHON_WORKER_URL },
        { status: 503 }
      )
    }
    console.error('[analyze-resume] Unexpected error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
