# ⚡ Performance Audit: Reactive Resume vs Harbor

> **Why does Reactive Resume feel so much faster when navigating between pages?**

This report breaks down every architectural and technical factor that contributes to the dramatic difference in perceived navigation speed between the two platforms.

---

## Executive Summary

| Factor | Harbor | Reactive Resume |
|---|---|---|
| **Framework** | Next.js 15.5 (App Router) | Vite + TanStack Start |
| **Rendering Model** | **Server-Side Rendering (SSR)** | **Client-Side SPA** (with SSR shell) |
| **Dev Server** | Turbopack (Next.js) | Vite (native ESM, Rolldown) |
| **Router** | Next.js file-system router | TanStack Router |
| **Navigation Type** | Full server round-trip per page | Client-side instant swap |
| **Preloading** | ❌ None | ✅ `defaultPreload: "intent"` |
| **View Transitions** | ❌ None | ✅ `defaultViewTransition: true` |
| **Auth Middleware** | Supabase `getUser()` on every nav | Cached session in router context |
| **Total Pages** | 117 | 97 route files |
| **CSS Size** | 5,949 bytes | 5,555 bytes |

> [!IMPORTANT]
> The #1 reason Harbor feels slow is **not a bug or bad code** — it's a fundamental architectural difference. Next.js App Router uses **server-side rendering**, which means every page navigation goes to the server, compiles the React tree, and sends back the HTML. Reactive Resume uses **client-side routing** where the browser already has the app and just swaps components instantly.

---

## 1. Navigation Model (The Biggest Factor)

### Harbor: Server Round-Trip on Every Navigation

```
User clicks link → Browser sends request to Next.js server
                → Server runs middleware (Supabase auth check)
                → Server compiles React Server Components
                → Server renders HTML
                → HTML sent to browser
                → Browser hydrates the page
                → Page is interactive
```

**Every page click** triggers this entire pipeline. This is why you see "compiling..." messages in development.

### Reactive Resume: Instant Client-Side Swap

```
User hovers over link → Router prefetches the route's code + data
User clicks link      → Router swaps the component instantly (already loaded)
                      → View transition animates smoothly
                      → Page is immediately interactive
```

> [!TIP]
> The key setting in Reactive Resume's `router.tsx`:
> ```ts
> defaultPreload: "intent",        // Prefetch on hover/focus
> defaultViewTransition: true,     // Smooth CSS transitions
> defaultStructuralSharing: true,  // Reuse unchanged data
> ```
> These three settings alone make navigation feel instant.

---

## 2. Dev Server Speed

### Harbor: Turbopack (next dev --turbopack)

- Uses Turbopack for incremental compilation
- Still needs to **compile React Server Components** on each navigation
- Must perform server-side data fetching and rendering
- Every page change triggers a "compiling /route..." message
- **HMR** is fast, but **initial page loads** require full compilation

### Reactive Resume: Vite (native ESM + Rolldown)

- Uses Vite's native ESM dev server — no bundling during development
- Modules are served as-is via HTTP, only transforming what the browser requests
- HMR is near-instantaneous (< 50ms typically)
- No server compilation needed for route changes (client-side router handles it)
- Uses `vite-plus` (enhanced Vite with Rolldown) for even faster transforms

> [!NOTE]
> In production builds, both frameworks would be more comparable. The speed difference is most pronounced during **development**, which is what you're experiencing.

---

## 3. Middleware & Authentication Overhead

### Harbor: Supabase Middleware Runs on Every Protected Route

From `middleware.ts`:

```ts
// This runs on EVERY matching request before the page renders
export async function middleware(request: NextRequest) {
  return await updateSession(request)  // ← Network call to Supabase
}
```

From `lib/supabase/middleware.ts`:

```ts
// Makes a network request to Supabase to verify the user on every navigation
const response = await supabase.auth.getUser()  // ← Blocks rendering
```

This means:
- **Every protected page navigation** makes a network request to Supabase
- The page **cannot render until this completes**
- With a 5-second timeout configured, slow networks amplify this

### Reactive Resume: Cached Session Context

From `routes/__root.tsx`:

```ts
beforeLoad: async () => {
  // Session is fetched ONCE at app load, then shared via context
  const [theme, locale, session, flags] = await Promise.all([
    getTheme(), getLocale(), getSession(), client.flags.get(),
  ]);
  return { theme, locale, session, flags };
}
```

From `routes/dashboard/route.tsx`:

```ts
beforeLoad: async ({ context }) => {
  // Auth check uses CACHED context — no network call!
  if (!context.session) throw redirect({ to: "/auth/login" });
}
```

**Result**: Auth is checked once, then reused from memory. No network calls on navigation.

---

## 4. Component Architecture Comparison

### Harbor: Deep Layout Nesting with Providers

```
RootLayout (layout.tsx)
  └─ AuthProvider (client component, calls getSession())
      └─ (student)/layout.tsx
          └─ SidebarProvider
              └─ HarborSidebar
                  └─ ScrollArea
                      └─ main
                          └─ PageComponent (SSR compiled)
```

Each layout level is a **server component boundary** that must be rendered on the server. The `AuthProvider` wraps the entire app as a client component, which causes the **entire component tree beneath it to be client-side**, negating some SSR benefits.

### Reactive Resume: Flat Provider Stack

```
RootDocument (one-time setup)
  └─ MotionConfig → I18nProvider → IconContext → ThemeProvider
      → TooltipProvider → ConfirmDialogProvider → PromptDialogProvider
          └─ Outlet (client-side route swap) ← Only this part changes
```

The provider stack is set up once. On navigation, only the `<Outlet />` swaps, which is a lightweight client-side component replacement.

---

## 5. Bundle & Import Analysis

### Harbor: Heavy Icon Libraries (Both Lucide AND Phosphor)

From `package.json`:

```json
"lucide-react": "^0.575.0",        // ← Still installed (750+ icons)
"@phosphor-icons/react": "^2.1.10"  // ← Also installed (1,200+ icons)
```

Harbor ships **two icon libraries**, doubling the icon-related bundle. Even with `optimizePackageImports`, both libraries are parsed by the bundler.

### Reactive Resume: Single Icon Library

```json
"@phosphor-icons/react": "^2.1.10"   // Only one icon library
"@phosphor-icons/web": "^2.1.2"      // CSS-only web icons (thin)
```

---

## 6. Data Fetching Patterns

### Harbor: Server Actions + Supabase on Each Page

Most Harbor pages fetch data in Server Components or via Server Actions, which means:
1. The page waits for the server to fetch from Supabase
2. The server renders the HTML with the data
3. The HTML is sent to the client
4. The client hydrates the page

### Reactive Resume: TanStack Query with Caching

RR uses `@tanstack/react-query` with:
- **Stale-while-revalidate**: Shows cached data instantly, updates in background
- **Route loaders**: Data is fetched in parallel with route transitions
- **SSR Query Integration**: Initial data is server-rendered, subsequent navigations use cache

---

## 7. Detailed Recommendation Table

| # | Issue | Impact | Fix | Effort |
|---|---|---|---|---|
| 1 | **SSR round-trip on every nav** | 🔴 Critical | Add `loading.tsx` skeletons to every layout | Medium |
| 2 | **Supabase `getUser()` per nav** | 🔴 Critical | Cache auth in cookie, skip middleware network calls | Medium |
| 3 | **No route prefetching** | 🟡 High | Add `<Link prefetch>` on all navigation links | Low |
| 4 | **Dual icon libraries** | 🟡 High | Remove `lucide-react`, use only Phosphor | Low |
| 5 | **No loading states** | 🟡 High | Add `loading.tsx` for all route groups | Low |
| 6 | **No client-side caching** | 🟠 Medium | Add TanStack Query for data fetching | High |
| 7 | **Dev server compilation** | 🟠 Medium | Inherent to Next.js — not fixable | — |
| 8 | **Heavy `motion` animations** | 🟢 Low | Already well-optimized | — |

---

## 8. Quick Wins (Immediate Improvements)

### 8.1 Add `loading.tsx` to Every Layout Group

This gives the user instant visual feedback instead of a blank screen.

```tsx
// app/(student)/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
```

### 8.2 Remove `lucide-react`

```bash
npm uninstall lucide-react
```
Then remove it from `next.config.mjs`'s `optimizePackageImports`. This reduces bundle parse time.

### 8.3 Add `prefetch` to Navigation Links

```tsx
// Before
<Link href="/student/dashboard">Dashboard</Link>

// After
<Link href="/student/dashboard" prefetch>Dashboard</Link>
```

### 8.4 Cache Auth in Middleware

Instead of calling `supabase.auth.getUser()` (network request) on every navigation, read the session from the cookie directly:

```ts
// Instead of this (network call):
const { data: { user } } = await supabase.auth.getUser()

// Do this (cookie read, no network):
const { data: { session } } = await supabase.auth.getSession()
const user = session?.user
```

> [!CAUTION]
> `getSession()` reads from the JWT cookie without verifying it with Supabase servers. This is fine for middleware routing decisions but should NOT be used for sensitive operations. Keep `getUser()` for actual data mutations.

---

## Conclusion

The performance gap between Reactive Resume and Harbor is primarily due to **architectural differences**, not code quality:

1. **Client-side routing (RR) vs Server-side rendering (Harbor)** — This is the #1 factor. RR swaps components in the browser; Harbor goes to the server for every page.
2. **Intent-based prefetching (RR) vs No prefetching (Harbor)** — RR loads the next page before you even click.
3. **Cached auth context (RR) vs Network auth check per navigation (Harbor)** — Harbor's middleware blocks rendering with a Supabase call.
4. **Vite's native ESM (RR) vs Turbopack's compilation model (Harbor)** — In development, Vite serves modules without bundling.

Harbor's architecture is not wrong — SSR provides better SEO, initial load times, and security. But it trades navigation speed for those benefits. The quick wins above can significantly narrow the gap.
