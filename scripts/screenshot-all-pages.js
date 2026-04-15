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

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      files.push(fullPath);
    }
  }

  return files;
}

function isRouteGroup(segment) {
  return segment.startsWith('(') && segment.endsWith(')');
}

function isParallelOrInterceptSegment(segment) {
  return segment.startsWith('@') || segment.includes('(.)') || segment.includes('(..)');
}

function resolveDynamicSegment(segment, replacements) {
  if (!segment.startsWith('[') || !segment.endsWith(']')) {
    return segment;
  }

  if (segment.startsWith('[[...') && segment.endsWith(']]')) {
    const key = segment.slice(5, -2);
    return replacements[key] || 'sample';
  }

  if (segment.startsWith('[...') && segment.endsWith(']')) {
    const key = segment.slice(4, -1);
    return replacements[key] || 'sample';
  }

  const key = segment.slice(1, -1);
  return replacements[key] || 'sample';
}

function toRouteFromPageFile(appDir, pageFilePath, replacements) {
  const pageDir = path.dirname(pageFilePath);
  const relativeDir = path.relative(appDir, pageDir);

  if (!relativeDir || relativeDir === '.') {
    return '/';
  }

  const parts = relativeDir.split(path.sep).filter(Boolean);
  const routeParts = [];

  for (const part of parts) {
    if (isRouteGroup(part)) {
      continue;
    }

    if (isParallelOrInterceptSegment(part)) {
      return null;
    }

    routeParts.push(resolveDynamicSegment(part, replacements));
  }

  if (routeParts.length === 0) {
    return '/';
  }

  return `/${routeParts.join('/')}`;
}

function discoverRoutes(appDir, replacements) {
  const files = walkFiles(appDir);
  const pageFiles = files.filter((filePath) => /[\\/]page\.(tsx|ts|jsx|js)$/.test(filePath));
  const routeSet = new Set();

  for (const pageFile of pageFiles) {
    const route = toRouteFromPageFile(appDir, pageFile, replacements);
    if (route) {
      routeSet.add(route);
    }
  }

  return Array.from(routeSet).sort((a, b) => a.localeCompare(b));
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

function hasCredentials(credentials) {
  return Boolean(credentials && credentials.email && credentials.password);
}

function buildHarborCredentials(args) {
  return {
    student: {
      email: args.studentemail || process.env.HARBOR_STUDENT_EMAIL || process.env.HARBOR_DEMO_EMAIL || '',
      password: args.studentpassword || process.env.HARBOR_STUDENT_PASSWORD || process.env.HARBOR_DEMO_PASSWORD || '',
    },
    recruiter: {
      email: args.recruiteremail || process.env.HARBOR_RECRUITER_EMAIL || '',
      password: args.recruiterpassword || process.env.HARBOR_RECRUITER_PASSWORD || '',
    },
    university: {
      email: args.universityemail || process.env.HARBOR_UNIVERSITY_EMAIL || '',
      password: args.universitypassword || process.env.HARBOR_UNIVERSITY_PASSWORD || '',
    },
  };
}

function harborRouteRole(route, org) {
  const recruiterSections = new Set([
    'analytics',
    'applications',
    'candidates',
    'dashboard',
    'help',
    'interviews',
    'jobs',
    'notifications',
    'profile',
    'reports',
    'saved-candidates',
    'search',
    'settings',
    'team',
  ]);

  if (route === '/' || route.startsWith('/landing') || route.startsWith('/pricing') || route.startsWith('/features')) {
    return 'public';
  }

  if (route.startsWith('/login') || route.startsWith('/register') || route.startsWith('/shared/')) {
    return 'public';
  }

  if (route.startsWith('/student/')) {
    return 'student';
  }

  if (route === '/dashboard' || route.startsWith('/notifications') || route.startsWith('/settings')) {
    return 'student';
  }

  const parts = route.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === org) {
    if (parts[1] === 'admin' || parts[1] === 'faculty' || parts[1] === 'student') {
      return 'university';
    }

    if (recruiterSections.has(parts[1])) {
      return 'recruiter';
    }
  }

  return 'public';
}

async function clickFirst(page, locators, timeout = 6000) {
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

async function openRoleTab(page, role) {
  if (role === 'student') {
    return true;
  }

  const tabLabel = role === 'recruiter' ? 'Recruiter' : 'University';
  return clickFirst(page, [
    page.getByRole('tab', { name: tabLabel }).first(),
    page.locator('button', { hasText: tabLabel }).first(),
    page.getByText(tabLabel, { exact: true }).first(),
  ]);
}

async function loginHarborRole(page, { baseUrl, role, email, password, timeoutMs }) {
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await waitForSettled(page, timeoutMs);

    if (!new URL(page.url()).pathname.startsWith('/login')) {
      return true;
    }

    await openRoleTab(page, role);

    const fieldPrefix = role === 'recruiter' ? 'recruiter' : role === 'university' ? 'university' : 'student';
    await page.locator(`#${fieldPrefix}-email`).waitFor({ state: 'visible', timeout: timeoutMs });
    await page.locator(`#${fieldPrefix}-email`).fill(email);
    await page.locator(`#${fieldPrefix}-password`).fill(password);

    await clickFirst(page, [
      page.getByRole('button', { name: 'Sign In' }).first(),
      page.getByRole('button', { name: 'Login' }).first(),
      page.getByRole('button', { name: 'Log In' }).first(),
    ], 12000);

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: timeoutMs });
    await waitForSettled(page, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

async function buildSessionSet({ browser, targetName, baseUrl, harborCredentials, timeoutMs }) {
  const sessions = {};

  const publicContext = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  sessions.public = {
    context: publicContext,
    page: await publicContext.newPage(),
    authenticated: true,
    role: 'public',
  };

  if (targetName !== 'harbor') {
    return sessions;
  }

  for (const role of ['student', 'recruiter', 'university']) {
    const credentials = harborCredentials[role];
    if (!hasCredentials(credentials)) {
      sessions[role] = {
        context: null,
        page: null,
        authenticated: false,
        role,
        reason: 'missing-credentials',
      };
      continue;
    }

    const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
    const page = await context.newPage();
    const authenticated = await loginHarborRole(page, {
      baseUrl,
      role,
      email: credentials.email,
      password: credentials.password,
      timeoutMs,
    });

    sessions[role] = {
      context,
      page,
      authenticated,
      role,
      reason: authenticated ? null : 'login-failed',
    };
  }

  return sessions;
}

async function closeSessionSet(sessions) {
  const contexts = new Set();

  for (const session of Object.values(sessions || {})) {
    if (session && session.context) {
      contexts.add(session.context);
    }
  }

  for (const context of contexts) {
    await context.close();
  }
}

function isTransientNavigationError(error) {
  const message = String(error instanceof Error ? error.message : error);
  return /Timeout|ERR_ABORTED|ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_CONNECTION_ABORTED/i.test(message);
}

async function isUrlReachable(url, timeoutMs) {
  const attempts = Number.parseInt(process.env.SCREENSHOT_READY_ATTEMPTS || '20', 10);
  const pauseMs = Number.parseInt(process.env.SCREENSHOT_READY_INTERVAL_MS || '2000', 10);

  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status >= 200 && response.status < 500) {
        return true;
      }
    } catch {
      // Retry while service warms up.
    }

    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, pauseMs));
    }
  }

  return false;
}

function buildTargetConfigs(rootDir, args) {
  const target = String(args.target || process.env.SCREENSHOT_TARGET || 'harbor').toLowerCase();

  const configs = {
    harbor: {
      name: 'harbor',
      appDir: path.join(rootDir, 'app'),
      baseUrl: args.harborbaseurl || args.baseurl || process.env.HARBOR_BASE_URL || 'http://localhost:3000',
    },
    resume: {
      name: 'resume',
      appDir: path.join(rootDir, 'reactive_resume', 'app'),
      baseUrl: args.resumebaseurl || process.env.RESUME_APP_URL || 'http://localhost:3001',
    },
  };

  if (target === 'all') {
    return [configs.harbor, configs.resume];
  }

  if (!configs[target]) {
    throw new Error(`Unknown target \"${target}\". Use harbor, resume, or all.`);
  }

  return [configs[target]];
}

async function waitForSettled(page, timeoutMs) {
  await page.waitForLoadState('domcontentloaded', { timeout: timeoutMs });
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Some pages keep background requests alive.
  }
}

async function captureTargetScreenshots({
  browser,
  targetConfig,
  outputRoot,
  dynamicReplacements,
  timeoutMs,
  waitMs,
  limit,
  harborCredentials,
}) {
  const { name, appDir, baseUrl } = targetConfig;
  const targetDir = path.join(outputRoot, name);
  ensureDir(targetDir);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!fs.existsSync(appDir)) {
    return {
      target: name,
      baseUrl,
      appDir,
      skipped: true,
      reason: 'App directory not found',
      routeCount: 0,
      successCount: 0,
      failureCount: 0,
      routes: [],
      screenshots: [],
    };
  }

  const reachable = await isUrlReachable(normalizedBaseUrl, Math.min(timeoutMs, 15000));
  if (!reachable) {
    return {
      target: name,
      baseUrl,
      appDir,
      skipped: true,
      reason: `Base URL is unreachable: ${normalizedBaseUrl}`,
      routeCount: 0,
      successCount: 0,
      failureCount: 0,
      routes: [],
      screenshots: [],
    };
  }

  const allRoutes = discoverRoutes(appDir, dynamicReplacements);
  const routes = Number.isFinite(limit) && limit > 0 ? allRoutes.slice(0, limit) : allRoutes;

  const sessions = await buildSessionSet({
    browser,
    targetName: name,
    baseUrl: normalizedBaseUrl,
    harborCredentials,
    timeoutMs,
  });
  const authSummary = Object.fromEntries(
    Object.entries(sessions).map(([key, value]) => [
      key,
      {
        authenticated: Boolean(value && value.authenticated),
        reason: value ? value.reason || null : 'not-created',
      },
    ])
  );

  const screenshots = [];

  try {
    for (let i = 0; i < routes.length; i += 1) {
      const route = routes[i];
      const requiredRole = name === 'harbor' ? harborRouteRole(route, dynamicReplacements.org) : 'public';
      const preferredSession = sessions[requiredRole] || sessions.public;
      const activeSession = preferredSession && preferredSession.authenticated ? preferredSession : sessions.public;
      const authContext =
        activeSession === preferredSession
          ? requiredRole
          : `${requiredRole}-fallback-${preferredSession && preferredSession.reason ? preferredSession.reason : 'public'}`;

      const page = activeSession.page;
      const url = `${normalizedBaseUrl}${route}`;
      const fileName = routeToFileName(i, route);
      const screenshotPath = path.join(targetDir, fileName);
      const record = {
        route,
        url,
        screenshot: screenshotPath,
        ok: false,
        status: null,
        authContext,
        error: null,
      };

      try {
        let response = null;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
            break;
          } catch (error) {
            const shouldRetry = attempt < 2 && isTransientNavigationError(error);
            if (!shouldRetry) {
              throw error;
            }
          }
        }

        await waitForSettled(page, timeoutMs);

        if (waitMs > 0) {
          await page.waitForTimeout(waitMs);
        }

        await page.screenshot({ path: screenshotPath, fullPage: true });

        record.ok = true;
        record.status = response ? response.status() : null;
      } catch (error) {
        record.error = String(error instanceof Error ? error.message : error);
      }

      screenshots.push(record);
      const outcome = record.ok ? `OK${record.status ? ` (${record.status})` : ''}` : `FAILED (${record.error})`;
      console.log(`[${name}] ${route} [${record.authContext}] -> ${outcome}`);
    }
  } finally {
    await closeSessionSet(sessions);
  }

  const summary = {
    target: name,
    baseUrl,
    appDir,
    skipped: false,
    authSummary,
    routeCount: routes.length,
    successCount: screenshots.filter((item) => item.ok).length,
    failureCount: screenshots.filter((item) => !item.ok).length,
    routes,
    screenshots,
  };

  fs.writeFileSync(path.join(targetDir, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));

  const outputRoot = path.resolve(
    rootDir,
    args.output || args.outputdir || path.join('artifacts', 'screenshots', `all-pages-${nowStamp()}`)
  );
  const timeoutMs = Number.parseInt(args.timeoutms || process.env.SCREENSHOT_TIMEOUT_MS || '90000', 10);
  const waitMs = Number.parseInt(args.waitms || process.env.SCREENSHOT_WAIT_MS || '350', 10);
  const limit = args.limit ? Number.parseInt(args.limit, 10) : null;
  const headless = !String(args.headful || '').toLowerCase().match(/^(1|true|yes)$/);
  const harborCredentials = buildHarborCredentials(args);

  const dynamicReplacements = {
    org: args.org || process.env.SCREENSHOT_ORG || 'ppsu',
    id: args.id || process.env.SCREENSHOT_ID || '1',
    courseId: args.courseid || process.env.SCREENSHOT_COURSE_ID || '1',
    slug: args.slug || process.env.SCREENSHOT_SLUG || 'sample',
    token: args.token || process.env.SCREENSHOT_TOKEN || 'sample-token',
  };

  const targets = buildTargetConfigs(rootDir, args);

  ensureDir(outputRoot);
  console.log(`Saving screenshots to: ${outputRoot}`);

  const browser = await chromium.launch({ headless });
  const results = [];

  try {
    for (const targetConfig of targets) {
      const result = await captureTargetScreenshots({
        browser,
        targetConfig,
        outputRoot,
        dynamicReplacements,
        timeoutMs,
        waitMs,
        limit,
        harborCredentials,
      });
      results.push(result);
    }
  } finally {
    await browser.close();
  }

  const overallSummary = {
    createdAt: new Date().toISOString(),
    outputRoot,
    targets: results,
  };

  fs.writeFileSync(path.join(outputRoot, 'summary.json'), JSON.stringify(overallSummary, null, 2));

  const totalRoutes = results.reduce((sum, item) => sum + (item.routeCount || 0), 0);
  const totalSuccess = results.reduce((sum, item) => sum + (item.successCount || 0), 0);
  const totalFailures = results.reduce((sum, item) => sum + (item.failureCount || 0), 0);

  console.log('');
  console.log('Screenshot run complete.');
  console.log(`Targets: ${results.map((item) => item.target).join(', ')}`);
  for (const item of results) {
    if (item.skipped) {
      console.log(`Skipped ${item.target}: ${item.reason}`);
    }
  }
  console.log(`Routes processed: ${totalRoutes}`);
  console.log(`Successful screenshots: ${totalSuccess}`);
  console.log(`Failed screenshots: ${totalFailures}`);

  if (totalFailures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Screenshot automation failed.');
  console.error(error);
  process.exit(1);
});
