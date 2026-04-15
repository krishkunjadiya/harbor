const fs = require('fs');
const path = require('path');
const { createHmac, randomUUID } = require('crypto');
const { chromium } = require('@playwright/test');
const { createServerClient } = require('@supabase/ssr');

function parseArgs(argv) {
  const result = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('-')) continue;

    const key = token.replace(/^-+/, '').toLowerCase();
    const next = argv[i + 1];

    if (!next || next.startsWith('-')) {
      result[key] = true;
      continue;
    }

    result[key] = next;
    i += 1;
  }

  return result;
}

function sanitizeName(input) {
  return String(input || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function escapeRegExp(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nowStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readLocalEnv() {
  try {
    const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    return Object.fromEntries(
      envText
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
  } catch {
    return {};
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getConfig() {
  const args = parseArgs(process.argv.slice(2));

  const harborBaseUrl = args.harborbaseurl || args.harborurl || process.env.HARBOR_BASE_URL || 'http://localhost:3000';
  const resumeBaseUrl = args.resumebaseurl || args.resumeurl || process.env.RESUME_APP_URL || 'http://localhost:3001';
  const studentEmail = args.studentemail || process.env.HARBOR_DEMO_EMAIL || process.env.HARBOR_EMAIL || '';
  const studentPassword = args.studentpassword || process.env.HARBOR_DEMO_PASSWORD || process.env.HARBOR_PASSWORD || '';

  const shouldRecord = String(args.record || process.env.DEMO_RECORD || '1').toLowerCase() !== '0';
  const typingMinDelay = Number.parseInt(process.env.DEMO_TYPING_MIN_DELAY || '40', 10);
  const typingMaxDelay = Number.parseInt(process.env.DEMO_TYPING_MAX_DELAY || '90', 10);

  const runId = `${nowStamp()}-${sanitizeName(studentEmail || 'unknown-user')}`;
  const outputDir = path.join(process.cwd(), 'artifacts', 'demo', runId);

  return {
    harborBaseUrl,
    resumeBaseUrl,
    studentEmail,
    studentPassword,
    shouldRecord,
    typingMinDelay,
    typingMaxDelay,
    runId,
    outputDir,
    screenshotsDir: path.join(outputDir, 'screenshots'),
    videosDir: path.join(outputDir, 'videos'),
    exportsDir: path.join(outputDir, 'exports'),
    jsonDir: path.join(outputDir, 'exports', 'json'),
    docxDir: path.join(outputDir, 'exports', 'docx'),
    pdfDir: path.join(outputDir, 'exports', 'pdf'),
    logsDir: path.join(outputDir, 'logs'),
  };
}

async function waitForSettled(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 90000 });
  try {
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  } catch {
    // Ignore long-lived requests.
  }
}

async function humanPause(page, min = 120, max = 320) {
  await page.waitForTimeout(randomInt(min, max));
}

async function waitForService(url, attempts = 20, timeoutMs = 5000) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
      if (response.status < 500) return true;
    } catch {
      // Retry until attempts are exhausted.
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  return false;
}

async function gotoWithRetry(page, url, options, attempts = 3) {
  let lastError = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      await page.goto(url, options);
      return;
    } catch (error) {
      lastError = error;
      const message = String(error instanceof Error ? error.message : error);
      const isTransient = /ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_CONNECTION_ABORTED|Timeout/i.test(message);

      if (!isTransient || i === attempts - 1) {
        throw error;
      }

      await page.waitForTimeout(1500 * (i + 1));
    }
  }

  throw lastError;
}

async function safeScreenshot(page, filePath) {
  try {
    await page.screenshot({ path: filePath, fullPage: true });
  } catch {
    // Best effort.
  }
}

async function clickFirst(locators, timeout = 10000) {
  for (const locator of locators) {
    try {
      await locator.click({ timeout });
      return true;
    } catch {
      // Try next selector.
    }
  }
  return false;
}

async function clearAndType(locator, text, config) {
  const value = String(text);

  await locator.click({ timeout: 15000 });

  try {
    await locator.press('Control+A');
  } catch {
    // Ignore if not supported.
  }

  try {
    await locator.press('Backspace');
  } catch {
    // Ignore if not supported.
  }

  const isLongText = value.length > 180;
  const delay = isLongText ? randomInt(6, 18) : randomInt(config.typingMinDelay, config.typingMaxDelay);
  const timeout = isLongText ? 120000 : 30000;

  await locator.type(value, { delay, timeout });
}

async function fillByLabel(scope, label, value, config) {
  const field = scope.getByLabel(label).first();
  await field.waitFor({ state: 'visible', timeout: 25000 });
  await clearAndType(field, value, config);
}

async function tryFillDialogRichText(dialog, value, config) {
  const editor = dialog.locator('[contenteditable="true"]').first();
  if ((await editor.count()) === 0) return false;

  await editor.scrollIntoViewIfNeeded().catch(() => null);
  await clearAndType(editor, value, config);
  return true;
}

async function closeActiveDialog(page) {
  const dialog = page.getByRole('dialog').first();
  const visible = await dialog.isVisible().catch(() => false);
  if (!visible) return;

  await clickFirst(
    [
      dialog.getByRole('button', { name: /cancel/i }).first(),
      dialog.getByRole('button', { name: /close/i }).first(),
      dialog.getByRole('button', { name: /done/i }).first(),
    ],
    2000
  ).catch(() => null);

  await page.keyboard.press('Escape').catch(() => null);
  await dialog.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => null);
}

async function tryFillByLabel(scope, labels, value, config) {
  const labelList = Array.isArray(labels) ? labels : [labels];

  for (const label of labelList) {
    try {
      const field = scope.getByLabel(label).first();
      if ((await field.count()) === 0) continue;

      await field.waitFor({ state: 'visible', timeout: 4000 });
      await clearAndType(field, value, config);
      return true;
    } catch {
      // Try next label candidate.
    }
  }

  return false;
}

async function fillRichEditorInSection(page, sectionId, text, config) {
  const section = page.locator(`#sidebar-${sectionId}`);
  const editor = section.locator('[contenteditable="true"]').first();

  if ((await editor.count()) === 0) return false;

  await editor.scrollIntoViewIfNeeded();
  await clearAndType(editor, text, config);
  await humanPause(page);
  return true;
}

async function bootstrapSupabaseAuth(context, config) {
  const localEnv = readLocalEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return false;

  const cookieMap = new Map();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Array.from(cookieMap.values());
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieMap.set(cookie.name, cookie);
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: config.studentEmail,
    password: config.studentPassword,
  });

  if (error || cookieMap.size === 0) return false;

  if (data?.user?.id && data?.user?.email) {
    const userMeta = data.user.user_metadata || {};
    config.harborSsoUser = {
      id: data.user.id,
      email: data.user.email,
      name: userMeta.full_name || userMeta.name || data.user.email,
      role: userMeta.user_type || 'student',
    };
  }

  const baseUrl = new URL(config.harborBaseUrl);
  const cookies = Array.from(cookieMap.values()).map(({ name, value, options = {} }) => ({
    name,
    value,
    domain: options.domain || baseUrl.hostname,
    path: options.path || '/',
    expires: typeof options.maxAge === 'number' ? Math.floor(Date.now() / 1000) + options.maxAge : -1,
    httpOnly: Boolean(options.httpOnly),
    secure: typeof options.secure === 'boolean' ? options.secure : baseUrl.protocol === 'https:',
    sameSite: 'Lax',
  }));

  await context.addCookies(cookies);
  return true;
}

function createLocalSsoLaunchUrl(config) {
  const user = config.harborSsoUser;
  if (!user?.id || !user?.email) return null;

  const localEnv = readLocalEnv();
  const secret = process.env.RESUME_SSO_SIGNING_KEY || localEnv.RESUME_SSO_SIGNING_KEY;
  if (!secret) return null;

  const rawTtl = process.env.RESUME_SSO_TOKEN_TTL_SECONDS || localEnv.RESUME_SSO_TOKEN_TTL_SECONDS || '900';
  const parsedTtl = Number.parseInt(rawTtl, 10);
  const ttl = Number.isFinite(parsedTtl) ? Math.max(120, Math.min(1800, parsedTtl)) : 900;
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    iss: 'harbor',
    aud: 'reactive_resume',
    sub: user.id,
    email: user.email,
    name: user.name || user.email,
    role: user.role || 'student',
    jti: randomUUID(),
    iat: now,
    exp: now + ttl,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');
  const token = `${signingInput}.${signature}`;

  const launchUrl = new URL('/sso/launch', config.resumeBaseUrl);
  launchUrl.searchParams.set('token', token);
  launchUrl.searchParams.set('returnPath', '/dashboard/resumes');
  return launchUrl.toString();
}

async function loginStudent(page, config) {
  const bootstrapped = await bootstrapSupabaseAuth(page.context(), config);

  if (bootstrapped) {
    await page.goto(`${config.harborBaseUrl}/student/dashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForSettled(page);
    if (!new URL(page.url()).pathname.startsWith('/login')) return;
  }

  await page.goto(`${config.harborBaseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForSettled(page);

  await clickFirst([
    page.getByRole('tab', { name: 'Student' }),
    page.getByRole('button', { name: 'Student' }),
    page.getByText('Student', { exact: true }),
  ]);

  await fillByLabel(page, 'Email', config.studentEmail, config);
  await fillByLabel(page, 'Password', config.studentPassword, config);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 120000 }),
    page.getByRole('button', { name: /^sign in$/i }).click({ timeout: 20000 }),
  ]);

  await waitForSettled(page);
}

async function requestFreshSsoLaunchUrl(page) {
  const payload = await page.evaluate(async () => {
    const response = await fetch('/api/resume/sso/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ returnPath: '/dashboard/resumes' }),
    });

    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body };
  });

  if (!payload.ok || !payload.body?.launchUrl) {
    const details = typeof payload.body?.error === 'string' ? `, error=${payload.body.error}` : '';
    throw new Error(`Unable to fetch SSO launch URL (status=${payload.status}${details})`);
  }

  return payload.body.launchUrl;
}

async function openResumeBuilderFromHarbor(page, context, config) {
  await page.goto(`${config.harborBaseUrl}/student/dashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForSettled(page);

  await waitForService(`${config.resumeBaseUrl}/auth/login`, 25, 4000);

  // Warm Resume app compile first so issued SSO token is consumed immediately.
  const warmPage = await context.newPage();
  try {
    await warmPage
      .goto(`${config.resumeBaseUrl}/auth/login`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      })
      .catch(() => null);
    await waitForSettled(warmPage).catch(() => null);
  } finally {
    await warmPage.close().catch(() => null);
  }

  // Issue a fresh SSO token and navigate immediately.
  let launchUrl = null;
  try {
    launchUrl = await requestFreshSsoLaunchUrl(page);
  } catch {
    launchUrl = createLocalSsoLaunchUrl(config);
  }

  if (launchUrl) {
    await gotoWithRetry(page, launchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 300000,
    });
  } else {
    await gotoWithRetry(page, `${config.harborBaseUrl}/student/resume-builder`, {
      waitUntil: 'domcontentloaded',
      timeout: 180000,
    });
  }

  await page
    .waitForURL(
      (url) => {
        const href = url.toString();
        return href.startsWith(config.resumeBaseUrl) || /\/dashboard\/resumes|\/builder\//.test(url.pathname);
      },
      { timeout: 240000 }
    )
    .catch(() => null);

  await waitForSettled(page);

  // Retry once with a fresh token if we landed on Resume auth login.
  if (new URL(page.url()).pathname.startsWith('/auth/login')) {
    await page.goto(`${config.harborBaseUrl}/student/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await waitForSettled(page);

    let secondLaunchUrl = null;
    try {
      secondLaunchUrl = await requestFreshSsoLaunchUrl(page);
    } catch {
      secondLaunchUrl = createLocalSsoLaunchUrl(config);
    }

    if (secondLaunchUrl) {
      await gotoWithRetry(page, secondLaunchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 300000,
      });
    } else {
      await gotoWithRetry(page, `${config.harborBaseUrl}/student/resume-builder`, {
        waitUntil: 'domcontentloaded',
        timeout: 180000,
      });
    }
    await waitForSettled(page);
  }

  if (!page.url().startsWith(config.resumeBaseUrl)) {
    await page.goto(`${config.resumeBaseUrl}/dashboard/resumes`, {
      waitUntil: 'domcontentloaded',
      timeout: 300000,
    });
    await waitForSettled(page);
  }

  return page;
}

async function createOrOpenResume(page, config) {
  const currentPath = new URL(page.url()).pathname;

  if (currentPath.startsWith('/auth/login')) {
    throw new Error('Resume SSO did not establish session (landed on /auth/login).');
  }

  if (!currentPath.startsWith('/dashboard')) {
    await page.goto(`${config.resumeBaseUrl}/dashboard/resumes`, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await waitForSettled(page);
  }

  await page.waitForTimeout(2000);

  const resumeName = `Harbor Demo Resume ${nowStamp()}`;
  const openedCreateDialog = await clickFirst([
    page.getByRole('button', { name: /create a new resume/i }),
    page.getByText('Create a new resume', { exact: true }),
    page.getByRole('heading', { name: /create a new resume/i }),
  ]);

  if (openedCreateDialog) {
    const dialog = page.getByRole('dialog').first();
    await dialog.waitFor({ state: 'visible', timeout: 20000 });

    await fillByLabel(dialog, 'Name', resumeName, config);

    await dialog.getByRole('button', { name: /^create$/i }).first().click({ timeout: 15000 });
    await dialog.waitFor({ state: 'hidden', timeout: 60000 });
    await page.waitForTimeout(1200);
  }

  const namedResumeLink = page.getByRole('link', { name: new RegExp(escapeRegExp(resumeName), 'i') }).first();

  if ((await namedResumeLink.count()) > 0) {
    await namedResumeLink.click({ timeout: 90000 });
  } else {
    const fallbackBuilderLink = page.locator('a[href^="/builder/"]').first();
    await fallbackBuilderLink.click({ timeout: 90000 });
  }

  await page.waitForURL(/\/builder\//, { timeout: 240000 });
  await waitForSettled(page);
}

async function createSectionItem(page, config, input) {
  const section = page.locator(`#sidebar-${input.sectionId}`);
  await section.scrollIntoViewIfNeeded();

  const clicked = await clickFirst(
    [
      section.getByRole('button', { name: input.buttonNameRegex }),
      section.getByText(input.buttonText, { exact: false }),
    ],
    15000
  );

  if (!clicked) {
    throw new Error(`Unable to click add button for section ${input.sectionId}`);
  }

  const dialog = page.getByRole('dialog').first();
  await dialog.waitFor({ state: 'visible', timeout: 25000 });

  for (const field of input.fields) {
    const filled = field.type === 'richtext'
      ? await tryFillDialogRichText(dialog, field.value, config)
      : await tryFillByLabel(dialog, field.labels || field.label, field.value, config);

    if (!filled && field.required !== false) {
      throw new Error(`Missing required field for section ${input.sectionId}`);
    }
    await humanPause(page, 80, 200);
  }

  await dialog.getByRole('button', { name: /^create$/i }).first().click({ timeout: 15000 });
  await dialog.waitFor({ state: 'hidden', timeout: 45000 });
  await humanPause(page, 150, 300);
}

async function tryCreateSectionItem(page, config, input) {
  try {
    await createSectionItem(page, config, input);
    return true;
  } catch {
    await closeActiveDialog(page);
    return false;
  }
}

async function fillAsManyFields(page, config) {
  const demoPerson = {
    fullName: 'Sophia Martin',
    headline: 'Senior Software Engineer | Full Stack | Cloud-Native Systems',
    email: 'sophia.martin@harbor.edu',
    phone: '+1 415 555 0198',
    location: 'San Francisco, California, USA',
    website: 'https://sophiamartin.dev',
    summary:
      'Senior software engineer with 6+ years of experience building high-scale SaaS platforms across education, fintech, and developer tooling. Strong track record in shipping resilient distributed systems, reducing cloud spend, and leading cross-functional delivery. Passionate about clean architecture, product-thinking, and mentoring early-career engineers.',
  };

  await fillByLabel(page, 'Name', demoPerson.fullName, config);
  await fillByLabel(page, 'Headline', demoPerson.headline, config);
  await fillByLabel(page, 'Email', demoPerson.email, config);
  await fillByLabel(page, 'Phone', demoPerson.phone, config);
  await fillByLabel(page, 'Location', demoPerson.location, config);

  await tryFillByLabel(page, ['Website', 'Portfolio', 'URL'], demoPerson.website, config);

  await fillRichEditorInSection(page, 'summary', demoPerson.summary, config);

  const profiles = [
    { network: 'LinkedIn', username: 'sophia-martin-engineer' },
    { network: 'GitHub', username: 'sophiamartin-dev' },
    { network: 'Portfolio', username: 'sophiamartin.dev' },
    { network: 'LeetCode', username: 'sophia_codes' },
  ];

  for (const profile of profiles) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'profiles',
      buttonNameRegex: /add a new profile/i,
      buttonText: 'Add a new profile',
      fields: [
        { label: 'Network', value: profile.network },
        { labels: ['Username', 'URL', 'Link'], value: profile.username },
      ],
    });
  }

  const skills = [
    'TypeScript',
    'JavaScript',
    'React',
    'Next.js',
    'Node.js',
    'PostgreSQL',
    'Redis',
    'Docker',
    'Kubernetes',
    'AWS',
    'CI/CD',
    'System Design',
    'GraphQL',
    'REST APIs',
  ];

  for (const skill of skills) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'skills',
      buttonNameRegex: /add a new skill/i,
      buttonText: 'Add a new skill',
      fields: [
        { label: 'Name', value: skill },
        { labels: ['Proficiency', 'Level'], value: 'Advanced', required: false },
      ],
    });
  }

  const experiences = [
    {
      company: 'Harbor Labs',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      period: 'Jul 2023 - Present',
    },
    {
      company: 'NovaStack Technologies',
      position: 'Software Engineer II',
      location: 'Remote',
      period: 'Jan 2021 - Jun 2023',
    },
    {
      company: 'ByteBridge Solutions',
      position: 'Software Engineer',
      location: 'Austin, TX',
      period: 'Jun 2019 - Dec 2020',
    },
  ];

  for (const experience of experiences) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'experience',
      buttonNameRegex: /add a new experience/i,
      buttonText: 'Add a new experience',
      fields: [
        { label: 'Company', value: experience.company },
        { labels: ['Position', 'Title'], value: experience.position },
        { label: 'Location', value: experience.location, required: false },
        { labels: ['Period', 'Date', 'Dates'], value: experience.period },
        {
          type: 'richtext',
          value:
            'Led delivery of customer-facing features and backend services, improved reliability with proactive monitoring, and collaborated with product/design teams to ship measurable improvements in user activation and retention.',
          required: false,
        },
      ],
    });
  }

  const education = [
    {
      school: 'University of California, Berkeley',
      degree: 'Master of Science',
      area: 'Computer Science',
      grade: '3.9/4.0',
      location: 'Berkeley, CA',
      period: '2017 - 2019',
    },
    {
      school: 'P P Savani University',
      degree: 'Bachelor of Technology',
      area: 'Computer Engineering',
      grade: '8.8 CGPA',
      location: 'Surat, India',
      period: '2013 - 2017',
    },
  ];

  for (const item of education) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'education',
      buttonNameRegex: /add a new education/i,
      buttonText: 'Add a new education',
      fields: [
        { label: 'School', value: item.school },
        { label: 'Degree', value: item.degree },
        { labels: ['Area of Study', 'Field of Study', 'Major'], value: item.area, required: false },
        { label: 'Grade', value: item.grade, required: false },
        { label: 'Location', value: item.location, required: false },
        { labels: ['Period', 'Date', 'Dates'], value: item.period },
      ],
    });
  }

  const projects = [
    { name: 'Harbor Resume Automation', period: '2026', description: 'Built Playwright automation to generate complete demo resumes and export all formats.' },
    { name: 'Realtime Student Analytics Platform', period: '2025', description: 'Developed event-driven dashboards with sub-second insights for 50k+ active users.' },
    { name: 'Cloud Cost Optimizer', period: '2024', description: 'Implemented autoscaling and rightsizing workflows that reduced monthly cloud spend by 28%.' },
    { name: 'Campus Placement Portal', period: '2023', description: 'Shipped end-to-end recruitment workflows used by students, recruiters, and university admins.' },
  ];

  for (const project of projects) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'projects',
      buttonNameRegex: /add a new project/i,
      buttonText: 'Add a new project',
      fields: [
        { label: 'Name', value: project.name },
        { labels: ['Period', 'Date', 'Dates'], value: project.period },
        { labels: ['Summary', 'Description'], value: project.description, required: false },
        { type: 'richtext', value: project.description, required: false },
      ],
    });
  }

  const certifications = [
    { title: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', date: '2025' },
    { title: 'Google Professional Cloud Developer', issuer: 'Google Cloud', date: '2024' },
    { title: 'Certified Kubernetes Application Developer', issuer: 'The Linux Foundation', date: '2024' },
  ];

  for (const cert of certifications) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'certifications',
      buttonNameRegex: /add a new certification/i,
      buttonText: 'Add a new certification',
      fields: [
        { labels: ['Title', 'Name'], value: cert.title },
        { label: 'Issuer', value: cert.issuer },
        { labels: ['Date', 'Issued Date'], value: cert.date },
      ],
    });
  }

  const languages = [
    { language: 'English', fluency: 'Native or Bilingual' },
    { language: 'Hindi', fluency: 'Native or Bilingual' },
    { language: 'Spanish', fluency: 'Professional Working Proficiency' },
  ];

  for (const item of languages) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'languages',
      buttonNameRegex: /add a new language/i,
      buttonText: 'Add a new language',
      fields: [
        { label: 'Language', value: item.language },
        { labels: ['Fluency', 'Level'], value: item.fluency },
      ],
    });
  }

  const awards = [
    { title: 'Engineering Excellence Award', issuer: 'Harbor Labs', date: '2025', summary: 'Recognized for leading migration to a zero-downtime deployment strategy.' },
    { title: 'Best Capstone Project', issuer: 'P P Savani University', date: '2017', summary: 'Built an AI-powered timetable optimizer for academic scheduling.' },
  ];

  for (const award of awards) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'awards',
      buttonNameRegex: /add a new award/i,
      buttonText: 'Add a new award',
      fields: [
        { labels: ['Title', 'Name'], value: award.title },
        { labels: ['Issuer', 'Awarder', 'Organization'], value: award.issuer, required: false },
        { labels: ['Date', 'Year'], value: award.date, required: false },
        { labels: ['Summary', 'Description'], value: award.summary, required: false },
      ],
    });
  }

  const volunteer = [
    { organization: 'Girls Who Code', position: 'Mentor', location: 'San Francisco, CA', period: '2024 - Present' },
    { organization: 'Code for Good Foundation', position: 'Technical Volunteer', location: 'Remote', period: '2022 - 2024' },
  ];

  for (const item of volunteer) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'volunteer',
      buttonNameRegex: /add a new volunteer/i,
      buttonText: 'Add a new volunteer',
      fields: [
        { labels: ['Organization', 'Company'], value: item.organization },
        { labels: ['Position', 'Role'], value: item.position },
        { label: 'Location', value: item.location, required: false },
        { labels: ['Period', 'Date', 'Dates'], value: item.period },
        {
          type: 'richtext',
          value:
            'Mentored students on resume writing, interview preparation, and portfolio projects; organized mock interviews and practical workshops.',
          required: false,
        },
      ],
    });
  }

  const references = [
    { name: 'Daniel Brooks', relation: 'Engineering Manager, Harbor Labs', email: 'daniel.brooks@harborlabs.ai', phone: '+1 415 555 0131' },
    { name: 'Priya Shah', relation: 'Staff Engineer, NovaStack Technologies', email: 'priya.shah@novastack.com', phone: '+1 512 555 0168' },
  ];

  for (const reference of references) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'references',
      buttonNameRegex: /add a new reference/i,
      buttonText: 'Add a new reference',
      fields: [
        { labels: ['Name', 'Full Name'], value: reference.name },
        { labels: ['Relationship', 'Reference', 'Position'], value: reference.relation, required: false },
        { label: 'Email', value: reference.email, required: false },
        { label: 'Phone', value: reference.phone, required: false },
      ],
    });
  }

  const interests = [
    'Distributed Systems',
    'Developer Experience',
    'Cloud Architecture',
    'AI Product Engineering',
    'Open Source Contributions',
    'Technical Mentorship',
  ];

  for (const interest of interests) {
    await tryCreateSectionItem(page, config, {
      sectionId: 'interests',
      buttonNameRegex: /add a new interest/i,
      buttonText: 'Add a new interest',
      fields: [{ labels: ['Name', 'Interest'], value: interest }],
    });
  }
}

async function ensureExportSectionReady(page) {
  const exportSection = page.locator('#sidebar-export');
  if ((await exportSection.count()) > 0) {
    await exportSection.scrollIntoViewIfNeeded().catch(() => null);

    // Expand section if collapsed.
    const hasButtonsVisible = await exportSection
      .getByRole('button', { name: /json|docx|pdf/i })
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasButtonsVisible) {
      await clickFirst([
        exportSection.getByRole('button').first(),
        exportSection.getByText('Export', { exact: false }),
      ]);
      await page.waitForTimeout(400);
    }
  }

  return exportSection;
}

function getExportSelectors(extension) {
  const map = {
    json: {
      iconClass: 'ph-file-js',
      label: 'JSON',
    },
    docx: {
      iconClass: 'ph-file-doc',
      label: 'DOCX',
    },
    pdf: {
      iconClass: 'ph-file-pdf',
      label: 'PDF',
    },
  };

  return map[extension] || null;
}

async function resolveExportButton(page, section, extension) {
  const selectors = getExportSelectors(extension);
  if (!selectors) throw new Error(`Unsupported export extension: ${extension}`);

  const candidates = [
    section.locator(`button:has(svg.${selectors.iconClass})`).first(),
    section.locator(`button:has(h6:has-text("${selectors.label}"))`).first(),
    section.getByRole('button', { name: new RegExp(`^${selectors.label}$`, 'i') }).first(),
    page.locator(`div.fixed.inset-x-0.bottom-4 button:has(svg.${selectors.iconClass})`).first(),
  ];

  for (const candidate of candidates) {
    try {
      if ((await candidate.count()) === 0) continue;
      await candidate.waitFor({ state: 'visible', timeout: 5000 });
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(`Unable to find export button for ${selectors.label}`);
}

async function resolveDockExportButton(page, extension) {
  const selectors = getExportSelectors(extension);
  if (selectors) {
    const iconButton = page.locator(`div.fixed.inset-x-0.bottom-4 button:has(svg.${selectors.iconClass})`).first();
    if ((await iconButton.count()) > 0) return iconButton;
  }

  const dockButtons = page.locator('div.fixed.inset-x-0.bottom-4 button');
  const count = await dockButtons.count();
  if (count < 3) return null;

  if (extension === 'json') return dockButtons.nth(count - 3);
  if (extension === 'docx') return dockButtons.nth(count - 2);
  if (extension === 'pdf') return dockButtons.nth(count - 1);

  return null;
}

async function triggerExportDownload(page, section, buttonRegex, targetDir, extension, timeout = 180000) {
  let button;
  try {
    button = await resolveExportButton(page, section, extension);
  } catch {
    button = await resolveDockExportButton(page, extension);
    if (!button) {
      throw new Error(`Unable to locate export control for ${extension}`);
    }
    await button.waitFor({ state: 'visible', timeout: 10000 });
  }

  await button.scrollIntoViewIfNeeded().catch(() => null);

  await dismissBlockingOverlays(page);

  const downloadPromise = page.waitForEvent('download', { timeout }).catch(() => null);
  try {
    await button.click({ timeout: 20000 });
  } catch {
    await dismissBlockingOverlays(page);
    await button.click({ timeout: 20000, force: true });
  }

  const download = await downloadPromise;
  if (!download) {
    return { ok: false, file: null, source: 'none' };
  }

  const suggested = download.suggestedFilename();
  const safeName = suggested && suggested.toLowerCase().endsWith(`.${extension}`)
    ? suggested
    : `${sanitizeName(path.parse(suggested || `resume-${nowStamp()}`).name)}.${extension}`;

  const savePath = path.join(targetDir, safeName);
  await download.saveAs(savePath);

  return { ok: true, file: savePath, source: 'app-download' };
}

async function exportAllFormats(page, config) {
  await dismissBlockingOverlays(page);
  const section = await ensureExportSectionReady(page);

  const jsonResult = await triggerExportDownload(page, section, /json/i, config.jsonDir, 'json', 120000);
  if (!jsonResult.ok) {
    throw new Error('JSON export did not produce a downloadable file');
  }

  const docxResult = await triggerExportDownload(page, section, /docx/i, config.docxDir, 'docx', 180000);
  if (!docxResult.ok) {
    throw new Error('DOCX export did not produce a downloadable file');
  }

  let pdfResult = await triggerExportDownload(page, section, /pdf/i, config.pdfDir, 'pdf', 240000);

  if (!pdfResult.ok) {
    const fallbackPath = path.join(config.pdfDir, `resume-fallback-${nowStamp()}.pdf`);
    await page.pdf({
      path: fallbackPath,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    pdfResult = { ok: true, file: fallbackPath, source: 'playwright-fallback' };
  }

  return {
    json: jsonResult,
    docx: docxResult,
    pdf: pdfResult,
  };
}

async function dismissBlockingOverlays(page) {
  if (!page || page.isClosed()) return;

  for (let i = 0; i < 3; i += 1) {
    const hasOverlay = await page
      .locator('[data-slot="dialog-overlay"][data-open]')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasOverlay) return;

    await clickFirst([
      page.getByRole('button', { name: /close/i }).first(),
      page.getByRole('button', { name: /cancel/i }).first(),
      page.getByRole('button', { name: /done/i }).first(),
    ], 2000).catch(() => null);

    await page.keyboard.press('Escape').catch(() => null);
    await page.waitForTimeout(300);
  }
}

async function run() {
  const config = getConfig();

  if (!config.studentEmail || !config.studentPassword) {
    throw new Error('Missing credentials. Provide -StudentEmail and -StudentPassword or set HARBOR_DEMO_EMAIL and HARBOR_DEMO_PASSWORD.');
  }

  ensureDir(config.screenshotsDir);
  ensureDir(config.videosDir);
  ensureDir(config.exportsDir);
  ensureDir(config.jsonDir);
  ensureDir(config.docxDir);
  ensureDir(config.pdfDir);
  ensureDir(config.logsDir);

  const summary = {
    runId: config.runId,
    startedAt: new Date().toISOString(),
    harborBaseUrl: config.harborBaseUrl,
    resumeBaseUrl: config.resumeBaseUrl,
    studentEmail: config.studentEmail,
    exports: {
      json: null,
      docx: null,
      pdf: null,
    },
    steps: [],
    video: null,
    status: 'running',
  };

  const logStep = (step, status, details = {}) => {
    summary.steps.push({
      step,
      status,
      at: new Date().toISOString(),
      ...details,
    });
  };

  let browser;
  let context;
  let page;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--window-size=1920,1080', '--disable-dev-shm-usage'],
    });

    context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      recordVideo: config.shouldRecord ? { dir: config.videosDir, size: { width: 1920, height: 1080 } } : undefined,
    });

    page = await context.newPage();

    logStep('login', 'running');
    await loginStudent(page, config);
    logStep('login', 'ok', { url: page.url() });
    await safeScreenshot(page, path.join(config.screenshotsDir, '01-after-login.png'));

    logStep('open-resume-builder', 'running');
    page = await openResumeBuilderFromHarbor(page, context, config);
    logStep('open-resume-builder', 'ok', { url: page.url() });
    await safeScreenshot(page, path.join(config.screenshotsDir, '02-after-sso-launch.png'));

    logStep('create-or-open-resume', 'running');
    await createOrOpenResume(page, config);
    logStep('create-or-open-resume', 'ok', { url: page.url() });
    await safeScreenshot(page, path.join(config.screenshotsDir, '03-opened-builder.png'));

    logStep('fill-many-fields', 'running');
    await fillAsManyFields(page, config);
    await dismissBlockingOverlays(page);
    logStep('fill-many-fields', 'ok');
    await safeScreenshot(page, path.join(config.screenshotsDir, '04-after-field-fill.png'));

    // Reopen only if the page is unexpectedly closed.
    if (page.isClosed()) {
      const recoveryPage = await context.newPage();
      await recoveryPage.goto(`${config.resumeBaseUrl}/dashboard/resumes`, {
        waitUntil: 'domcontentloaded',
        timeout: 180000,
      });
      await waitForSettled(recoveryPage);

      const resumeLink = recoveryPage.locator('a[href^="/builder/"]').first();
      await resumeLink.click({ timeout: 90000 });
      await recoveryPage.waitForURL(/\/builder\//, { timeout: 180000 });
      await waitForSettled(recoveryPage);
      page = recoveryPage;
    }

    logStep('export-all-formats', 'running');
    const exportsResult = await exportAllFormats(page, config);
    summary.exports = {
      json: exportsResult.json.file,
      docx: exportsResult.docx.file,
      pdf: exportsResult.pdf.file,
    };
    logStep('export-all-formats', 'ok', {
      jsonSource: exportsResult.json.source,
      docxSource: exportsResult.docx.source,
      pdfSource: exportsResult.pdf.source,
    });

    await safeScreenshot(page, path.join(config.screenshotsDir, '05-final.png'));
    summary.status = 'ok';
  } catch (error) {
    summary.status = 'failed';
    summary.error = error instanceof Error ? error.message : String(error);

    if (page) {
      await safeScreenshot(page, path.join(config.screenshotsDir, '99-failure.png'));
    }

    throw error;
  } finally {
    summary.finishedAt = new Date().toISOString();

    try {
      if (page && page.video()) {
        summary.video = await page.video().path();
      }
    } catch {
      // Best effort.
    }

    const summaryPath = path.join(config.logsDir, 'run-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[resume-demo-automation]', error instanceof Error ? error.message : error);
    process.exit(1);
  });
