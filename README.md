# Harbor: Unified Employability and Recruitment Platform

[![Built with Next.js](https://img.shields.io/Credential/Built%20with-Next.js-black?style=for-the-Credential&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/Credential/TypeScript-3178C6?style=for-the-Credential&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/Credential/Supabase-3ECF8E?style=for-the-Credential&logo=supabase&logoColor=white)](https://supabase.com)
[![FastAPI](https://img.shields.io/Credential/FastAPI-009688?style=for-the-Credential&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

A production-ready full-stack platform connecting student career readiness, university academic workflows, and recruiter hiring operations in a unified system.

## 🎯 Overview

Harbor eliminates fragmentation in campus placement ecosystems by providing:

- **Student Experience**: Profile building, job applications, AI-powered resume analysis, and structured interview preparation
- **Recruiter Workflows**: Job posting, candidate discovery, interview scheduling, and comprehensive hiring analytics
- **University Operations**: Academic credentialing, Credential workflows, and employability tracking
- **Real-time Collaboration**: Live notifications, updates, and cross-stakeholder visibility

## 🚀 Key Features

### Students
- Role-based dashboard with job recommendations
- Resume analyzer with ATS alignment suggestions
- Structured interview preparation with question bank and progress tracking
- Application status tracking
- Credential and Credential management

### Recruiters
- Job lifecycle management (create, publish, review applications)
- Advanced candidate search and filtering
- Interview scheduling and evaluation workflows
- Exportable reports and analytics
- Real-time candidate pipeline visibility

### Universities
- Faculty dashboards for student records
- Credential and Credential issuance workflows
- Academic integration with employability metrics
- Administrative oversight and reporting

### Security & Performance
- Row-level security (RLS) policies on PostgreSQL
- Multi-layer authorization checks
- Server-side data loading with scoped caching
- Indexed queries for optimal performance
- Secure file uploads with Supabase Storage

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Supabase, FastAPI (Python worker) |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Authentication |
| **AI/ML** | FastAPI worker for resume analysis and NLP tasks |
| **Storage** | Supabase Storage, Local file system |
| **Real-time** | Supabase Realtime subscriptions |
| **UI Components** | Radix UI, shadcn/ui primitives |
| **Testing** | Jest, Playwright |
| **Linting** | ESLint, TypeScript compiler |

## 📋 Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **pnpm** 
- **Python** ≥ 3.9 (for FastAPI worker)
- **Supabase** project (PostgreSQL database, Auth, Storage, Realtime)
- **Environment variables** configured

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/harbor.git
cd harbor
```

### 2. Install Dependencies
```bash
npm install
cd reactive_resume && pnpm install && cd ..
cd python_worker && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
```

### 3. Configure Environment Variables
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Set Up Database
```bash
# Run migrations (if any)
npm run db:migrate

# Seed data (optional)
npm run seed
```

### 5. Start Development Servers

**Harbor only:**
```bash
npm run dev:harbor
```

**Harbor + Reactive Resume:**
```bash
npm run dev:all
```

**Python worker (in separate terminal):**
```bash
npm run worker:win  # Windows
# or
npm run worker      # macOS/Linux
```

Access:
- **Harbor**: http://localhost:3000
- **Reactive Resume**: http://localhost:3001
- **Python Worker**: http://localhost:8000/docs

## 📚 Documentation

- [Database Setup](./SUPABASE-SETUP-GUIDE.md)
- [Architecture Guide](./md/COMPLETE-IMPLEMENTATION.md)
- [Deployment Guide](./md/DATABASE-SETUP-GUIDE.md)
- [Performance Optimization](./HARBOR_PERFORMANCE_OPTIMIZATION.md)
- [Full Project Report](./md/HARBOR-PROJECT-REPORT-SUBMISSION.md)

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Run Tests for Reactive Resume
```bash
npm run test:resume
```

### Screenshot All Pages
```bash
npm run screenshot:pages
```

### Performance Benchmarking
```bash
npm run bench:nav
```

## 🏗 Project Structure

```
harbor/
├── app/                    # Next.js App Router
│   ├── (student)/         # Student routes
│   ├── (recruiter)/       # Recruiter routes
│   ├── (university)/      # University routes
│   ├── (dashboard)/       # Shared dashboards
│   ├── api/               # API routes
│   └── shared/            # Shared layouts
├── components/            # React components
│   ├── ui/               # UI primitives
│   ├── student/          # Student-specific components
│   └── settings/         # Settings components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client setup
│   ├── auth/             # Authentication logic
│   ├── actions/          # Server actions
│   └── types/            # TypeScript types
├── python_worker/         # FastAPI service
│   ├── main.py           # Application entry
│   └── services/         # AI/ML services
├── reactive_resume/       # Resume builder integration
├── scripts/              # Utility scripts
├── sql/                  # Database migrations
└── public/               # Static assets
```

## 🔐 Security Considerations

- **Row-Level Security (RLS)**: All database tables enforce RLS policies
- **Authentication**: Supabase JWT-based auth with role-based access control
- **Authorization**: Middleware checks and server-side validation
- **File Uploads**: Secure Supabase Storage with signed URLs
- **Rate Limiting**: API route protections
- **Environment Secrets**: Never commit `.env.local`

## 📊 Database Schema

Key tables:
- `users` - Authentication and profile
- `students` - Student-specific data
- `recruiters` - Recruiter profiles
- `universities` - Institution data
- `jobs` - Job postings
- `applications` - Job applications
- `interviews` - Interview sessions
- `credentials` - Credentials and certificates
- `resumes` - Resume storage
- `files` - General file uploads

For full schema, see [Database Setup Guide](./SUPABASE-SETUP-GUIDE.md)

## 🚀 Deployment

### Deploy to Vercel
```bash
vercel deploy
```

### Environment Setup for Production
Set the following in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- All other required env variables from `.env.local.example`

### Database Backups
Supabase automatically handles daily backups. Configure retention in Supabase dashboard.

## 🤝 Contributing

Contributions are welcome! Please follow our [Contributing Guidelines](./CONTRIBUTING.md).

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "feat: add feature"`
3. Push to your fork: `git push origin feature/your-feature`
4. Open a Pull Request

### Code Standards
- Use TypeScript with strict mode enabled
- Follow ESLint configuration
- Write tests for new features
- Ensure all tests pass before pushing

## 📜 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev:harbor` | Start Harbor dev server (port 3000) |
| `npm run dev:all` | Start Harbor + Reactive Resume |
| `npm run build` | Build Next.js production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run worker:win` | Start Python worker (Windows) |
| `npm run screenshot:pages` | Generate screenshots |

## 🐛 Troubleshooting

### Port Already in Use
```bash
npm run free:ports  # Windows
# or manually kill processes on ports 3000, 3001
```

### Python Worker Issues
```bash
# Recreate virtual environment
cd python_worker
rm -rf .venv
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# or
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in `.env.local`
- Check Supabase project is active
- Test connection in Supabase dashboard

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 👥 Authors

- **Krish** - Developer & Maintainer

## 🙋 Support

For issues, questions, or suggestions:
- Open an [issue](../../issues)
- Check [existing documentation](./md/)
- Review [full project report](./md/HARBOR-PROJECT-REPORT-SUBMISSION.md)

## 🔗 Links

- **[Supabase Setup Guide](./SUPABASE-SETUP-GUIDE.md)**
- **[Database Design](./md/DATABASE-SETUP.md)**
- **[Deployment Guide](./md/DATABASE-SETUP-GUIDE.md)**
- **[Performance Audit](./HARBOR_PERFORMANCE_OPTIMIZATION.md)**
- **[Full Technical Report](./md/HARBOR-PROJECT-REPORT-SUBMISSION.md)**

---

**Harbor** - Connecting students, recruiters, and universities in one platform. 🚢
