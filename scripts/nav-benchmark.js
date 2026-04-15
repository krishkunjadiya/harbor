const fs = require('fs')
const path = require('path')
const { performance } = require('perf_hooks')
const { chromium } = require('@playwright/test')
const { createServerClient } = require('@supabase/ssr')

function percentile(values, p) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[idx]
}

function average(values) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function toMs(value) {
  return value == null ? '-' : `${Math.round(value)} ms`
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function readLocalEnv() {
  try {
    const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    return Object.fromEntries(
      envText
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=')
          return [line.slice(0, index), line.slice(index + 1)]
        })
    )
  } catch {
    return {}
  }
}

async function waitForSettled(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
  try {
    await page.waitForLoadState('networkidle', { timeout: 12000 })
  } catch {
    // Some pages keep long-lived network activity; domcontentloaded is enough for navigation timing.
  }
}

async function bootstrapSupabaseAuth(context, { baseUrl, email, password }) {
  const localEnv = readLocalEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  const cookieMap = new Map()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieMap.values())
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieMap.set(cookie.name, cookie)
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || cookieMap.size === 0) {
    return false
  }

  const url = new URL(baseUrl)
  const isSecure = url.protocol === 'https:'
  const cookies = Array.from(cookieMap.values()).map(({ name, value, options = {} }) => ({
    name,
    value,
    domain: options.domain || url.hostname,
    path: options.path || '/',
    expires: typeof options.maxAge === 'number' ? Math.floor(Date.now() / 1000) + options.maxAge : -1,
    httpOnly: Boolean(options.httpOnly),
    secure: typeof options.secure === 'boolean' ? options.secure : isSecure,
    sameSite: 'Lax',
  }))

  await context.addCookies(cookies)
  return true
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function openRoleTab(page, role) {
  if (role === 'student') {
    return
  }

  const tabLabel = role === 'recruiter' ? 'Recruiter' : 'University'
  const candidates = [
    page.getByRole('tab', { name: tabLabel }),
    page.locator('button', { hasText: tabLabel }).first(),
    page.getByText(tabLabel, { exact: true }).first(),
  ]

  for (const locator of candidates) {
    try {
      await locator.click({ timeout: 8000 })
      return
    } catch {
      // Try next selector strategy.
    }
  }

  throw new Error(`Unable to switch to ${tabLabel} tab`)
}

async function login(page, context, { baseUrl, role, email, password }) {
  try {
    const cookieBootstrapped = await bootstrapSupabaseAuth(context, { baseUrl, email, password })
    if (cookieBootstrapped) {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 })
      await waitForSettled(page)
      if (!new URL(page.url()).pathname.startsWith('/login')) {
        return true
      }
    }

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })

    if (!new URL(page.url()).pathname.startsWith('/login')) {
      await waitForSettled(page)
      return true
    }

    await openRoleTab(page, role)

    const fieldPrefix = role === 'recruiter' ? 'recruiter' : role === 'university' ? 'university' : 'student'
    await page.locator(`#${fieldPrefix}-email`).waitFor({ state: 'visible', timeout: 120000 })
    await page.locator(`#${fieldPrefix}-email`).fill(email)
    await page.locator(`#${fieldPrefix}-password`).fill(password)

    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45000 })
    await waitForSettled(page)
    return true
  } catch {
    return false
  }
}

async function registerIfNeeded(page, { baseUrl, role, email, password, org }) {
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await openRoleTab(page, role)

  if (role === 'recruiter') {
    const company = org || 'techcorp'
    const companySlug = slugify(company)

    await page.locator('#recruiter-firstname').fill('Bench')
    await page.locator('#recruiter-lastname').fill('Runner')
    await page.locator('#recruiter-email').fill(email)
    await page.locator('#recruiter-company').fill(company)
    await page.locator('#recruiter-title').fill('Talent Lead')
    await page.locator('#recruiter-phone').fill('+1-555-000-0000')
    await page.locator('#recruiter-password').fill(password)
    await page.locator('#recruiter-confirm-password').fill(password)
    await page.locator('#recruiter-terms').click()
    await page.getByRole('button', { name: 'Create Recruiter Account' }).click()

    await page.waitForURL((url) => !url.pathname.startsWith('/register') || url.pathname.includes('/dashboard'), { timeout: 90000 })
    await waitForSettled(page)
    return { org: companySlug }
  }

  if (role === 'university') {
    const universityName = org || 'ppsu'
    const universitySlug = slugify(universityName)

    await page.locator('#university-name').fill(universityName)
    await page.locator('#university-admin-firstname').fill('Bench')
    await page.locator('#university-admin-lastname').fill('Runner')
    await page.locator('#university-email').fill(email)
    await page.locator('#university-phone').fill('+1-555-000-0000')
    await page.locator('#university-address').fill('Benchmark Street 1')
    await page.locator('#university-city').fill('Benchmark City')
    await page.locator('#university-country').fill('Benchmarkland')
    await page.locator('#university-password').fill(password)
    await page.locator('#university-confirm-password').fill(password)
    await page.locator('#university-terms').click()
    await page.getByRole('button', { name: 'Register University' }).click()

    await page.waitForURL((url) => !url.pathname.startsWith('/register') || url.pathname.includes('/dashboard'), { timeout: 90000 })
    await waitForSettled(page)
    return { org: universitySlug }
  }

  await page.locator('#student-firstname').fill('Bench')
  await page.locator('#student-lastname').fill('Runner')
  await page.locator('#student-email').fill(email)
  await page.locator('#student-university').fill('PPSU University')
  await page.locator('#student-password').fill(password)
  await page.locator('#student-confirm-password').fill(password)
  await page.locator('#student-terms').click()
  await page.getByRole('button', { name: 'Create Student Account' }).click()

  await page.waitForURL((url) => !url.pathname.startsWith('/register') || url.pathname.includes('/student/dashboard'), { timeout: 90000 })
  await waitForSettled(page)
  return { org }
}

function getFlows(role, org) {
  if (role === 'recruiter') {
    const root = `/${org}`
    return [
      { name: 'dashboard->applications', from: `${root}/dashboard`, to: `${root}/applications` },
      { name: 'dashboard->reports', from: `${root}/dashboard`, to: `${root}/reports` },
      { name: 'dashboard->saved-candidates', from: `${root}/dashboard`, to: `${root}/saved-candidates` },
    ]
  }

  if (role === 'university') {
    const root = `/${org}/admin`
    const flows = [
      { name: 'dashboard->members', from: `${root}/dashboard`, to: `${root}/members` },
      { name: 'dashboard->reports', from: `${root}/dashboard`, to: `${root}/reports` },
      { name: 'dashboard->analytics', from: `${root}/dashboard`, to: `${root}/analytics` },
      { name: 'dashboard->faculty-admin', from: `${root}/dashboard`, to: `${root}/faculty` },
      { name: 'dashboard->students-admin', from: `${root}/dashboard`, to: `${root}/students` },
    ]

    if (process.env.HARBOR_INCLUDE_CROSS_CONTEXT === '1') {
      flows.push(
        { name: 'dashboard->faculty-dashboard', from: `${root}/dashboard`, to: `/${org}/faculty/dashboard` },
        { name: 'dashboard->student-dashboard', from: `${root}/dashboard`, to: `/${org}/student/dashboard` }
      )
    }

    return flows
  }

  return [
    { name: 'dashboard->jobs', from: '/student/dashboard', to: '/student/jobs' },
    { name: 'dashboard->applications', from: '/student/dashboard', to: '/student/applications' },
  ]
}

function buildMarkdown({ role, repeats, flows, startedAt, baseUrl }) {
  const lines = []
  lines.push('# Harbor Navigation Benchmark Results')
  lines.push('')
  lines.push(`- Date: ${startedAt}`)
  lines.push(`- Base URL: ${baseUrl}`)
  lines.push(`- Role: ${role}`)
  lines.push(`- Repeats per flow: ${repeats}`)
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Flow | Cold | Warm p50 | Warm p95 | Warm avg | Samples | Status |')
  lines.push('|---|---:|---:|---:|---:|---:|---|')

  for (const flow of flows) {
    lines.push(
      `| ${flow.name} | ${toMs(flow.cold)} | ${toMs(flow.warmP50)} | ${toMs(flow.warmP95)} | ${toMs(flow.warmAvg)} | ${flow.warmSamples} | ${flow.failed ? 'partial' : 'ok'} |`
    )
  }

  lines.push('')
  lines.push('## Raw Samples')
  lines.push('')
  for (const flow of flows) {
    lines.push(`### ${flow.name}`)
    lines.push(`- Cold: ${toMs(flow.cold)}`)
    lines.push(`- Warm samples: ${flow.warmDurations.length ? flow.warmDurations.map((d) => `${Math.round(d)} ms`).join(', ') : 'none'}`)
    lines.push('')
  }

  return lines.join('\n')
}

async function run() {
  const baseUrl = process.env.HARBOR_BASE_URL || 'http://localhost:3000'
  const role = (process.env.HARBOR_ROLE || 'student').toLowerCase()
  const autoRegister = process.env.HARBOR_AUTO_REGISTER === '1'
  const generatedEmail = `bench.${role}.${Date.now()}@harbor.local`
  const email = process.env.HARBOR_EMAIL || generatedEmail
  const password = process.env.HARBOR_PASSWORD || 'Harbor@2024'
  let org = process.env.HARBOR_ORG || (role === 'university' ? 'ppsu' : 'techcorp')
  const repeats = Number(process.env.HARBOR_REPEATS || 7)

  if ((!process.env.HARBOR_EMAIL || !process.env.HARBOR_PASSWORD) && !autoRegister) {
    console.error('Missing login credentials.')
    console.error('Set HARBOR_EMAIL and HARBOR_PASSWORD, or set HARBOR_AUTO_REGISTER=1 to bootstrap benchmark users.')
    process.exit(1)
  }

  if (!['student', 'recruiter', 'university'].includes(role)) {
    console.error(`Unsupported HARBOR_ROLE: ${role}`)
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const startedAt = new Date().toISOString()

  try {
    let isLoggedIn = await login(page, context, { baseUrl, role, email, password })

    if (!isLoggedIn && autoRegister) {
      const registration = await registerIfNeeded(page, { baseUrl, role, email, password, org })
      if (registration.org) {
        org = registration.org
      }
      isLoggedIn = await login(page, context, { baseUrl, role, email, password })
    }

    if (!isLoggedIn) {
      throw new Error('Unable to authenticate benchmark user. Provide valid credentials or enable HARBOR_AUTO_REGISTER=1.')
    }

    const flowDefs = getFlows(role, org)

    const flowResults = []

    for (const flow of flowDefs) {
      const durations = []
      let failures = 0

      for (let i = 0; i < repeats; i += 1) {
        try {
          await page.goto(`${baseUrl}${flow.from}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await waitForSettled(page)

          const navStart = performance.now()

          const linkLocator = page.locator(`a[href='${flow.to}']`).first()
          if ((await linkLocator.count()) > 0) {
            await Promise.all([
              page.waitForURL(new RegExp(`${escapeRegex(baseUrl)}${escapeRegex(flow.to)}($|\\?)`), { timeout: 120000 }),
              linkLocator.click(),
            ])
          } else {
            await page.goto(`${baseUrl}${flow.to}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
          }

          await waitForSettled(page)
          const navDuration = performance.now() - navStart
          durations.push(navDuration)
        } catch (error) {
          failures += 1
          const message = error instanceof Error ? error.message : 'unknown error'
          console.warn(`[bench:nav] ${flow.name} attempt ${i + 1} failed: ${message}`)
          if (failures >= 2) {
            break
          }
        }
      }

      const cold = durations[0] || null
      const warmDurations = durations.slice(1)
      const warmP50 = percentile(warmDurations, 50)
      const warmP95 = percentile(warmDurations, 95)
      const warmAvg = average(warmDurations)

      flowResults.push({
        name: flow.name,
        from: flow.from,
        to: flow.to,
        durations,
        cold,
        warmDurations,
        warmP50,
        warmP95,
        warmAvg,
        warmSamples: warmDurations.length,
        failed: failures > 0,
      })
    }

    const output = {
      startedAt,
      baseUrl,
      role,
      org,
      repeats,
      results: flowResults,
    }

    const outDir = path.join(process.cwd(), 'md')
    const stamp = startedAt.replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
    const jsonPath = path.join(outDir, `NAV-BENCHMARK-${stamp}.json`)
    const mdPath = path.join(outDir, `NAV-BENCHMARK-${stamp}.md`)

    fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf8')
    fs.writeFileSync(mdPath, buildMarkdown({ role, repeats, flows: flowResults, startedAt, baseUrl }), 'utf8')

    console.log(`Benchmark complete.`)
    console.log(`JSON: ${jsonPath}`)
    console.log(`Markdown: ${mdPath}`)
  } finally {
    await context.close()
    await browser.close()
  }
}

run().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
