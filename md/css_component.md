Harbor UI/UX Migration to Reactive Resume Style
Migrate all Harbor dashboard screens to use the exact same UI/UX patterns, design tokens, sidebar system, and component styling as Reactive Resume.

User Review Required
IMPORTANT

This is a large UI overhaul affecting every dashboard layout in Harbor. The sidebar navigation, header, color system, and key UI components will all change.

WARNING

Harbor currently uses lucide-react icons throughout. Reactive Resume uses @phosphor-icons/react. Switching icon libraries in all 60+ dashboard pages would be a massive scope change. This plan will use @phosphor-icons/ icons  matches everything with reactive resume (colors, fonts, sidebar shape, layout patterns). 

CAUTION

Reactive Resume uses @base-ui/react instead of @radix-ui for some primitives (e.g., Button). Since Harbor's entire component library is built on Radix, this plan use @base-ui/react primitives and matches the CVA styling and visual output exactly. 

Key Differences Identified
Aspect	Harbor (Current)	Reactive Resume (Target)
Color tokens	HSL (0 0% 100%)	OKLCH (oklch(1 0 0))
Font	System default font-sans	IBM Plex Sans
Border radius	0.5rem	0.45rem
Sidebar	Custom fixed w-72, border-right	Floating variant, icon-collapsible
Sidebar width	18rem (72 = 288px)	16rem (256px)
Header	Sticky top bar with search	No global header; per-page headers with SidebarTrigger
Icons	lucide-react	@phosphor-icons/react
Button primitives	Radix Slot	@base-ui/react
Text rendering	Default	proportional-nums antialiased
Selection colors	Default	selection:bg-primary selection:text-primary-foreground
Dark mode borders	240 3.7% 15.9%	oklch(1 0 0 / 10%) (semi-transparent)
Proposed Changes
Phase 1: Design Tokens & Global Styles
[MODIFY] 
globals.css
Replace the entire CSS file to match Reactive Resume's token system:

Switch from HSL to OKLCH color values (matching RR exactly)
Add --color-* theme mappings via @theme inline
Add IBM Plex Sans as --font-sans
Change --radius from 0.5rem to 0.45rem
Add success color token
Add sidebar tokens (--sidebar-primary, --sidebar-ring, etc.)
Add RR's base layer styles: proportional-nums antialiased, selection colors
Add no-scrollbar utility and aspect-page utility
Add reduced-motion media query
[MODIFY] 
layout.tsx
Add Google Fonts import for IBM Plex Sans Variable
Apply font-sans to body (it will now resolve to IBM Plex Sans)
[MODIFY] 
tailwind.config.js
Remove custom color mappings (now handled by @theme inline in CSS)
Remove custom borderRadius (now handled by CSS vars)
Keep container and animation config
Add success color token reference
Phase 2: Sidebar System Overhaul
[NEW] 
sidebar-ui.tsx
Create the full shadcn sidebar component system (adapted from RR) with these sub-components:

SidebarProvider
 — context with expanded/collapsed state, keyboard shortcut (Ctrl+B), mobile sheet
Sidebar
 — floating variant with icon-collapsible mode
SidebarTrigger
 — toggle button
SidebarRail
 — drag rail for toggling
SidebarHeader
, 
SidebarFooter
, 
SidebarContent
 — structural slots
SidebarGroup
, 
SidebarGroupLabel
, 
SidebarGroupContent
 — grouping
SidebarMenu
, 
SidebarMenuItem
, 
SidebarMenuButton
 — menu items with CVA variants
SidebarSeparator
, 
SidebarInset
This is adapted from RR's 660-line sidebar.tsx but uses Radix primitives available in Harbor instead of @base-ui/react.

[MODIFY] 
sidebar.tsx
Complete rewrite to use the new sidebar-ui components:

Use Sidebar variant="floating" collapsible="icon" wrapper
Group nav items into 
SidebarGroup
 with 
SidebarGroupLabel
 sections
Use 
SidebarMenuButton
 with active state styling
Add user avatar in 
SidebarFooter
 with dropdown menu
Add 
SidebarRail
 for drag-to-collapse
Keep all existing navigation data (studentNavItems, adminNavItems, etc.)
[DELETE] 
sidebar-provider.tsx
The old simple sidebar provider is replaced by the new 
SidebarProvider
 inside sidebar-ui.tsx. The portal/org/universityRole context will be preserved but merged into the new provider.

Phase 3: Layout Updates
[MODIFY] 
layout.tsx (student)
[MODIFY] 
layout.tsx (dashboard)
[MODIFY] 
layout.tsx (university)
[MODIFY] 
layout.tsx (recruiter)
All 4 layout files will be updated to:

Use new 
SidebarProvider
 from sidebar-ui
Replace <div className="lg:pl-72"> with flex layout (flex min-h-svh)
Replace sticky <Header /> with <main className="@container flex-1 p-4 md:ps-2"> pattern
Remove <Breadcrumbs /> from layout (can be added per-page if needed)
[MODIFY] 
layout.tsx (root)
Remove the root-level 
SidebarProvider
 wrapper (it's now in each layout)
Add IBM Plex Sans font link
[MODIFY] 
header.tsx
Transform from a global sticky header to a reusable 
DashboardHeader
 component:

Simple flex row with 
SidebarTrigger
 (mobile only) + icon + title text
Match RR's 
DashboardHeader
 pattern exactly
Keep the user dropdown but move it to the sidebar footer
Phase 4: UI Component Updates
[MODIFY] 
button.tsx
Update the button CVA variants to match RR:

Add icon-sm, icon-xs, icon-lg, xs, sm size variants
Update destructive variant to RR's transparent style (bg-destructive/10 text-destructive)
Update outline variant styling
Add focus-visible:border-ring focus-visible:ring-3 focus pattern
Keep Radix Slot for asChild support
[MODIFY] 
card.tsx
Minor updates to card component to match RR patterns — no major structural changes needed since both use the same shadcn card pattern.

[NEW] 
separator.tsx
Add a Separator component (used by the new sidebar).

[NEW] 
sheet.tsx
Add a Sheet component (used by the mobile sidebar).

[NEW] 
tooltip.tsx
Add a Tooltip component (used by collapsed sidebar tooltips).

Verification Plan
Browser Visual Testing
Run npm run dev from e:\KRISH(PPSU)\Semester 6\Major Project\Harbor
Open http://localhost:3000 in browser
Log in as a student user
Verify the following on the student dashboard:
Sidebar: Floating variant with rounded corners, gap from screen edge, icon-collapsible on desktop (Ctrl+B), sheet on mobile
Colors: Dark mode should show OKLCH-based tokens with semi-transparent borders
Font: IBM Plex Sans should be visible
Header: No sticky global header; page titles inline with SidebarTrigger
Cards: Should use updated token colors
Navigate to other portals (admin, university, recruiter) and verify same layout
Manual Verification Steps
Please verify after implementation:

Open student dashboard → sidebar should float with rounded corners and a gap from screen edges
Press Ctrl+B → sidebar should collapse to icon-only mode
Resize to mobile → sidebar should become a slide-out sheet
Toggle dark mode → colors should match Reactive Resume's dark theme
Check font → text should render in IBM Plex Sans
Navigate all routes → each portal's sidebar should show correct nav items with RR-style grouped sections