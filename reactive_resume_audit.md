# Reactive Resume Component & Dependency Audit

This audit categorizes every third-party package, UI component library, and functional tool used by Reactive Resume to build its platform based on its architecture and `package.json`.

## 🎨 UI Component Libraries & Primitives
These are the foundational building blocks for the user interface.

- **Base UI / React** (`@base-ui/react`): Headless UI components used for flexible, accessible, unstyled primitives.
- **Radix UI** (`@radix-ui/react-*`): A massive suite of unstyled, accessible UI components used throughout the app for dropdowns, tabs, dialogs, tooltips, accordions, and more.
- **Phosphor Icons** (`@phosphor-icons/react`, `@phosphor-icons/web`): The core icon library used globally for all visual iconography.
- **Tailwind CSS** (`tailwindcss`, `tailwindcss-animate`): The primary CSS utility framework used for styling all components.
- **Class Variance Authority** (`class-variance-authority`, `clsx`, `tailwind-merge`): Used to conditionally merge Tailwind classes and create component variants (like Shadcn UI buttons).

## 🚀 Animations & Interactive UI
Components specifically used for motion, drag-and-drop, and complex interactions.

- **Framer Motion** (`motion`): Used heavily for all UI animations, page transitions, and micro-interactions.
- **DnD Kit** (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`): The drag-and-drop engine used in the resume builder to reorder sections, skills, and work experiences.
- **React Resizable Panels** (`react-resizable-panels`): Used for drag-to-resize split panes (like the resume editor left sidebar vs the preview pane).
- **React Zoom Pan Pinch** (`react-zoom-pan-pinch`): Provides the interactive zoom-in/zoom-out and panning functionality on the live resume preview document.
- **Sonner** (`sonner`): A highly animated, interactive toast notification system.
- **Embla Carousel** (`embla-carousel-react`): Used for swipeable carousels and sliders.
- **Recharts** (`recharts`): Used for drawing dynamic graphs and visual analysis of data.

## ⌨️ Advanced Input & Editor Components
Highly specialized interactive inputs used for specific data entry.

- **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, etc.): The rich-text editor engine (WYSIWYG) used for formatting job descriptions (bold, italics, lists) within the resume builder.
- **Monaco Editor** (`@monaco-editor/react`, `monaco-editor`): The code editor component used by users who want to write Custom CSS for their resumes.
- **UIW Colorful** (`@uiw/react-color-colorful`, `@uiw/color-convert`): Used as the exact color picker component for choosing resume theme colors.
- **CMDK (Command Palette)** (`cmdk`): The interactive global search popup (`Cmd/Ctrl + K`) used to quickly navigate the dashboard and settings.

## 💾 State Management & Forms
Libraries that manage data flow, client state, and form validation.

- **Zustand** (`zustand`): The primary global state management library used to hold the "live" resume data as the user edits it.
- **Zundo** (`zundo`): An undo/redo middleware for Zustand, allowing users to easily undo completely mistakes while building their resume.
- **Immer** (`immer`): Used for safely mutating deeply nested state objects (like nested arrays inside the resume data).
- **React Hook Form** (`react-hook-form`): The core engine for handling all user input forms efficiently.
- **Zod** (`zod`): Used extensively for schema validation to ensure the resume data being submitted is structured correctly.
- **Hookform Resolvers** (`@hookform/resolvers`): Connects React Hook Form with Zod for automatic form validation errors.

## 🌐 Routing & Data Fetching
How the application navigates and talks to the server.

- **TanStack Router** (`@tanstack/react-router`): A completely type-safe routing library used instead of Next.js native router for complex client-side routing.
- **TanStack Query** (`@tanstack/react-query`): Used for robust data fetching, caching, and syncing API state with the UI.
- **oRPC** (`@orpc/server`, `@orpc/client`): A type-safe RPC (Remote Procedure Call) library used to communicate between the client and the backend API instantly without complex REST endpoints.

## 📄 Rendering, Exporting & PDF
Non-UI libraries that do the heavy lifting of turning web data into files.

- **Puppeteer Core** (`puppeteer-core`): Used via the backend server to spawn a headless browser, render the React resume component perfectly, and take a native PDF snapshot for downloading.
- **Docx** (`docx`): Used for exporting the resume data strictly into Microsoft Word (`.docx`) format.
- **QR Code React** (`qrcode.react`): Used to dynamically generate scannable QR codes for shared public resume links.

## 🌍 Localization (i18n)
- **LinguiJS** (`@lingui/react`, `@lingui/core`): The framework used to translate and localize every string in the UI into dozens of different languages dynamically.

## 🔐 Auth & Database (Backend Integration)
- **Better Auth** (`better-auth`, `@better-auth/react`): The authentication engine used for user signups, sign-ins, magic links, and social logins (Google, GitHub, etc.).
- **Drizzle ORM** (`drizzle-orm`, `drizzle-zod`): The TypeScript ORM used to communicate with the PostgreSQL database securely.

## 🤖 Artificial Intelligence (AI) Plugins
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`, etc.): The engine used to connect to OpenAI/Anthropic/Google to generate resume summaries, write cover letters, and auto-improve bullet points.

## 🛠️ Essential Utilities (Non-UI)
- **Date-Fns** (`date-fns`): Used for formatting, parsing, and calculating dates (e.g., "Aug 2021 - Present").
- **ES Toolkit** (`es-toolkit`): A modern, high-performance alternative to Lodash for array and object manipulation.
- **Fuse.js** (`fuse.js`): A lightweight fuzzy-search library used for finding specific skills or jobs locally on the client.
- **Bcrypt** (`bcrypt`): Used for securely hashing user passwords before storing them in the database.
