const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

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

function nowStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeFileName(input) {
  return String(input)
    .trim()
    .replace(/[^a-zA-Z0-9-_/.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/.]+|[-/.]+$/g, '')
    .slice(0, 180);
}

function routeToFileName(index, route) {
  const prefix = String(index + 1).padStart(4, '0');
  if (route === '/') {
    return `${prefix}-home.png`;
  }
  const slug = sanitizeFileName(route.replace(/^\//, '').replace(/\//g, '__')) || 'route';
  return `${prefix}-${slug}.png`;
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/$/, '');
}

async function waitForSettled(page, timeoutMs) {
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Pages keep background requests alive.
  }
}

async function loginStudent(page, { baseUrl, email, password, timeoutMs }) {
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await waitForSettled(page, timeoutMs);

    if (!new URL(page.url()).pathname.startsWith('/login')) {
      return true;
    }

    await page.locator('#student-email').waitFor({ state: 'visible', timeout: timeoutMs });
    await page.locator('#student-email').fill(email);
    await page.locator('#student-password').fill(password);
    await page.getByRole('button', { name: /sign in|login/i }).first().click();

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: timeoutMs });
    await waitForSettled(page, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

const studentRoutes = [
  '/',
  '/student/dashboard',
  '/student/profile',
  '/student/jobs',
  '/student/applications',
  '/student/skills',
  '/student/credentials',
  '/student/learning-resources',
  '/student/career-insights',
  '/student/interview-prep',
  '/student/resume-builder',
  '/student/resume-analyzer',
  '/student/notifications',
  '/student/help',
  '/student/settings',
  '/student/settings/profile',
  '/student/settings/security',
  '/student/settings/permissions',
  '/student/settings/communication',
];

async function captureStudentPages({ browser, baseUrl, email, password, timeoutMs, waitMs, outputRoot }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const targetDir = path.join(outputRoot, 'student-pages');
  ensureDir(targetDir);

  const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  const page = await context.newPage();

  const authenticated = await loginStudent(page, { baseUrl: normalizedBaseUrl, email, password, timeoutMs });
  if (!authenticated) {
    console.log('Failed to authenticate student; skipping page capture');
    await context.close();
    return {
      success: 0,
      failed: 0,
      screenshots: [],
      error: 'Authentication failed',
    };
  }

  console.log('Student authenticated successfully');

  const screenshots = [];
  for (let i = 0; i < studentRoutes.length; i += 1) {
    const route = studentRoutes[i];
    const url = `${normalizedBaseUrl}${route}`;
    const fileName = routeToFileName(i, route);
    const screenshotPath = path.join(targetDir, fileName);
    const record = {
      route,
      url,
      screenshot: screenshotPath,
      ok: false,
      status: null,
      error: null,
    };

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      await waitForSettled(page, timeoutMs);

      if (waitMs > 0) {
        await page.waitForTimeout(waitMs);
      }

      await page.screenshot({ path: screenshotPath, fullPage: true });

      record.ok = true;
      record.status = response ? response.status() : null;

      console.log(`✓ ${route}`);
    } catch (error) {
      record.error = String(error instanceof Error ? error.message : error);
      console.log(`✗ ${route}: ${record.error.split('\n')[0]}`);
    }

    screenshots.push(record);
  }

  await context.close();

  const success = screenshots.filter((s) => s.ok).length;
  const failed = screenshots.filter((s) => !s.ok).length;

  fs.writeFileSync(path.join(targetDir, 'summary.json'), JSON.stringify({
    baseUrl: normalizedBaseUrl,
    studentEmail: email,
    success,
    failed,
    total: studentRoutes.length,
    createdAt: new Date().toISOString(),
    screenshots,
  }, null, 2));

  return { success, failed, screenshots };
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  const baseUrl = args.baseurl || process.env.HARBOR_BASE_URL || 'http://localhost:3000';
  const email = args.studentemail || args.email || process.env.HARBOR_STUDENT_EMAIL || process.env.HARBOR_DEMO_EMAIL || '';
  const password = args.studentpassword || args.password || process.env.HARBOR_STUDENT_PASSWORD || process.env.HARBOR_DEMO_PASSWORD || '';
  const timeoutMs = Number.parseInt(args.timeoutms || process.env.SCREENSHOT_TIMEOUT_MS || '90000', 10);
  const waitMs = Number.parseInt(args.waitms || process.env.SCREENSHOT_WAIT_MS || '400', 10);
  const outputRoot = path.resolve(
    rootDir,
    args.output || args.outputdir || path.join('artifacts', 'screenshots', `student-pages-${nowStamp()}`)
  );

  if (!email || !password) {
    console.error('Error: Student email and password required');
    process.exit(1);
  }

  ensureDir(outputRoot);
  console.log(`\nCapturing student pages to: ${outputRoot}`);
  console.log('Total routes to capture:', studentRoutes.length);
  console.log('');

  const browser = await chromium.launch({ headless: true });

  try {
    const result = await captureStudentPages({
      browser,
      baseUrl,
      email,
      password,
      timeoutMs,
      waitMs,
      outputRoot,
    });

    console.log('');
    console.log(`✓ Success: ${result.success}`);
    console.log(`✗ Failed: ${result.failed}`);
    console.log(`Output: ${outputRoot}`);

    if (result.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Student screenshot capture failed:', error.message);
  process.exit(1);
});
