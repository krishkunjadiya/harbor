#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs')
const path = require('node:path')
const { createClient } = require('@supabase/supabase-js')

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const separator = trimmed.indexOf('=')
  if (separator <= 0) return null

  const key = trimmed.slice(0, separator).trim()
  let value = trimmed.slice(separator + 1).trim()

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue

    if (typeof process.env[parsed.key] === 'undefined') {
      process.env[parsed.key] = parsed.value
    }
  }
}

function loadEnvFallbacks() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env'))
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

async function main() {
  loadEnvFallbacks()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[resume-slo-check] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exitCode = 2
    return
  }

  const windowMinutes = numberFromEnv('RESUME_ALERT_WINDOW_MINUTES', 15)
  const minSuccessRate = numberFromEnv('RESUME_ALERT_MIN_SUCCESS_RATE', 0.995)
  const maxP95Ms = numberFromEnv('RESUME_ALERT_MAX_P95_MS', 1800)

  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from('resume_sso_audit')
    .select('action, metadata, created_at')
    .in('action', ['launch_success', 'launch_failure'])
    .gte('created_at', cutoff)

  if (error) {
    console.error('[resume-slo-check] Query failed:', error.message)
    process.exitCode = 2
    return
  }

  const rows = data || []
  const successCount = rows.filter((row) => row.action === 'launch_success').length
  const failureCount = rows.filter((row) => row.action === 'launch_failure').length
  const total = successCount + failureCount

  if (total === 0) {
    console.log('[resume-slo-check] No launch data in window; skipping threshold enforcement')
    process.exitCode = 0
    return
  }

  const successRate = successCount / total
  const successLatencies = rows
    .filter((row) => row.action === 'launch_success')
    .map((row) => {
      const elapsed = row?.metadata?.elapsedMs
      return typeof elapsed === 'number' && Number.isFinite(elapsed) ? elapsed : null
    })
    .filter((value) => value !== null)

  const p95 = percentile(successLatencies, 95)

  console.log(
    '[resume-slo-check] window=%dmin total=%d success=%d failure=%d successRate=%.4f p95Ms=%s',
    windowMinutes,
    total,
    successCount,
    failureCount,
    successRate,
    p95 === null ? 'n/a' : p95.toFixed(1),
  )

  const failedSuccessRate = successRate < minSuccessRate
  const failedP95 = p95 !== null && p95 > maxP95Ms

  if (failedSuccessRate || failedP95) {
    if (failedSuccessRate) {
      console.error(
        '[resume-slo-check] FAILED success rate threshold: actual=%.4f threshold=%.4f',
        successRate,
        minSuccessRate,
      )
    }

    if (failedP95) {
      console.error(
        '[resume-slo-check] FAILED p95 threshold: actual=%.1fms threshold=%.1fms',
        p95,
        maxP95Ms,
      )
    }

    process.exitCode = 1
    return
  }

  console.log('[resume-slo-check] PASSED thresholds')
  process.exitCode = 0
}

main().catch((error) => {
  console.error('[resume-slo-check] Unexpected error:', error instanceof Error ? error.message : error)
  process.exitCode = 2
})
