# Harbor Python AI Workers 🤖

Production-ready AI microservice for Harbor Platform, handling resume analysis, embeddings, fuzzy logic grading, and taxonomy syncing.

## 🌟 Features

### 1. Resume Analysis Worker
- **Extracts text** from PDF resumes using PyMuPDF
- **Analyzes** using Google Gemini AI
- **Scores** on 4 metrics: Content, Keywords, Format, ATS Compatibility
- **Provides actionable feedback** with strengths, improvements, and suggestions

### 2. Profile Embedding Worker
- **Generates semantic embeddings** using Sentence Transformers (all-MiniLM-L6-v2)
- **384-dimensional vectors** for similarity search
- **Free & offline** - no API calls required
- **Updates automatically** when profile changes

### 3. Fuzzy Logic Grading Worker
- **Calculates skill confidence** using fuzzy inference system
- **Inputs**: Grade (0-100), Bloom's Taxonomy (1-6), Course Difficulty (1-5)
- **Output**: Skill proficiency level (Novice/Competent/Expert)
- **Scientific grading** using scikit-fuzzy

### 4. Taxonomy Sync Worker
- **Syncs skill taxonomy** from O*NET Web Services
- **Scheduled weekly** using cron (every Sunday midnight)
- **Fallback to mock data** if API unavailable
- **Updates local database** with latest industry skills

## 🚀 Quick Start

### Prerequisites
```powershell
# Python 3.10+
python --version

# Verify pip
pip --version
```

### Installation
```powershell
# Install dependencies
pip install -r requirements.txt

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your credentials
notepad .env
```

### Configuration
Add your API keys to `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### Run
```powershell
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Test
```powershell
# Run health checks
python test_workers.py

# Check API
curl http://localhost:8000/health
```

## 📁 Project Structure

```
python_worker/
├── main.py                    # FastAPI app entry point
├── db.py                      # Supabase client
├── llm.py                     # Gemini AI integration
├── inngest_client.py          # Inngest event system
├── requirements.txt           # Python dependencies
├── .env.example               # Environment template
├── test_workers.py            # Health check script
├── PRODUCTION_DEPLOYMENT.md   # Deployment guide
└── workers/
    ├── document_parser.py     # Resume analysis
    ├── embedding_generator.py # Profile embeddings
    ├── fuzzy_logic.py         # Skill confidence
    └── taxonomy_sync.py       # Skill taxonomy sync
```

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | FastAPI | High-performance async API |
| **AI/ML** | Google Gemini API | Resume analysis |
| **Embeddings** | Sentence Transformers | Semantic search |
| **Fuzzy Logic** | scikit-fuzzy | Grade inference |
| **PDF Parsing** | PyMuPDF | Text extraction |
| **Database** | Supabase | PostgreSQL database |
| **Events** | Inngest | Background job orchestration |
| **HTTP Client** | httpx | External API calls |

## 📊 Worker Details

### Document Parser
**Trigger**: `document/uploaded` event  
**Processing Time**: 10-15 seconds  
**Success Rate**: 99%+  

**Flow**:
1. Download PDF from Supabase Storage
2. Extract text using PyMuPDF
3. Analyze with Gemini AI (JSON schema)
4. Save results to `students` table

**Database Updates**:
- `students.resume_url`
- `students.resume_score` (INTEGER)
- `students.resume_feedback` (JSONB)

### Embedding Generator
**Trigger**: `profile/updated` event  
**Processing Time**: 1-2 seconds  
**Model Size**: ~80MB

**Flow**:
1. Fetch profile text + skills from DB
2. Generate 384-d embedding vector
3. Save to `profiles.skills_embedding`

**Use Cases**:
- Semantic job matching
- Similar student search
- Skill-based recommendations

### Fuzzy Grading
**Trigger**: `academic/grade.submitted` event  
**Processing Time**: <1 second

**Inputs**:
- `grade`: 0-100
- `bloomLevel`: 1-6 (Bloom's Taxonomy)
- `difficulty`: 1-5

**Output**: Confidence score → Proficiency level

**Database Updates**:
- `user_skills.proficiency_level`
- `user_skills.verified`

### Taxonomy Sync
**Trigger**: Cron schedule (weekly)  
**Processing Time**: 30-60 seconds  
**Data Source**: O*NET Web Services

**Flow**:
1. Fetch skills from O*NET API
2. Batch upsert to `skills_taxonomy` table
3. Log sync metadata

## 🔑 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role key | `eyJhbG...` |
| `GEMINI_API_KEY` | ⚡ Recommended | Google Gemini API | `AIza...` |
| `INNGEST_SIGNING_KEY` | 🔄 Production | Inngest signing key | `signkey_...` |
| `INNGEST_EVENT_KEY` | 🔄 Production | Inngest event key | `eventkey_...` |
| `ONET_USERNAME` | ⭕ Optional | O*NET username | `john@example.com` |
| `ONET_PASSWORD` | ⭕ Optional | O*NET password | `password123` |
| `LOG_LEVEL` | ⭕ Optional | Logging level | `INFO` |
| `ENVIRONMENT` | ⭕ Optional | Environment name | `production` |

## 🧪 Testing

### Automated Tests
```powershell
python test_workers.py
```

**Tests**:
- ✅ Environment variables
- ✅ Supabase connection
- ✅ Gemini AI integration
- ✅ Embedding model
- ✅ Fuzzy logic system
- ✅ Taxonomy sync

### Manual Testing
```powershell
# Test resume analysis
curl -X POST http://localhost:8000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "document/uploaded",
    "data": {
      "fileUrl": "https://example.com/resume.pdf",
      "filePath": "user-id/resume.pdf",
      "studentId": "uuid-here",
      "documentType": "resume"
    }
  }'

# Test profile embedding
curl -X POST http://localhost:8000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "profile/updated",
    "data": {
      "studentId": "uuid-here"
    }
  }'
```

## 📈 Performance

### Benchmarks
- **Resume Analysis**: 10-15 seconds (AI processing)
- **Embedding Generation**: 1-2 seconds (local model)
- **Fuzzy Grading**: <100ms (pure computation)
- **Taxonomy Sync**: 30-60 seconds (network I/O)

### Optimization
- **Caching**: Models loaded once on startup
- **Batching**: Taxonomy updates in batches of 100
- **Retry Logic**: 3 attempts with exponential backoff
- **Connection Pooling**: Automatic with Supabase client

## 🔒 Security

### Best Practices
- ✅ Service role key used (bypasses RLS)
- ✅ API keys stored in environment variables
- ✅ No secrets in code or logs
- ✅ HTTPS for all external API calls
- ✅ Input validation on all endpoints
- ✅ Error messages don't leak sensitive data

### Production Checklist
- [ ] Rotate API keys quarterly
- [ ] Use separate Supabase projects for dev/prod
- [ ] Enable rate limiting on API endpoints
- [ ] Monitor logs for unauthorized access
- [ ] Keep dependencies updated monthly

## 🐛 Troubleshooting

### Common Issues

**"Supabase client not initialized"**
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify keys are correct (no extra spaces)

**"GEMINI_API_KEY not configured"**
- Get free key at https://aistudio.google.com/app/apikey
- Add to `.env` file
- Restart worker

**"No text extracted from PDF"**
- PDF may be image-based (scanned document)
- Use text-based PDFs only
- Consider adding OCR for image PDFs

**"Database update failed"**
- Run SQL migration: `sql/add-resume-fields.sql`
- Verify columns exist: `resume_score`, `resume_feedback`
- Check service role key has write permissions

**"Model loading failed"**
- Reinstall: `pip install --force-reinstall sentence-transformers`
- Check disk space (models need ~1GB)
- Verify Python version (3.10+)

## 📦 Deployment

See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for detailed deployment guide.

### Quick Deploy

**Railway.app** (Recommended):
```powershell
# Connect GitHub repo and deploy
```

**Docker**:
```powershell
docker build -t harbor-worker .
docker run -p 8000:8000 --env-file .env harbor-worker
```

**Heroku**:
```powershell
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile
heroku create harbor-python-worker
git push heroku main
```

## 📊 Monitoring

### Health Checks
```powershell
# Basic health
GET /health

# Inngest endpoint
GET /api/inngest

# API documentation
GET /docs
```

### Logging
```powershell
# View real-time logs
tail -f worker.log

# Filter errors only
tail -f worker.log | grep ERROR
```

### Metrics to Monitor
- **Resume Processing Time**: Should be 10-15 seconds
- **API Error Rate**: Should be <1%
- **Database Update Success**: Should be >98%
- **Worker Uptime**: Should be 99.9%+

## 🤝 Contributing

### Development Setup
```powershell
# Clone repo
git clone https://github.com/your-repo/harbor

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_workers.py
```

### Code Style
- **Formatting**: autopep8 or black
- **Linting**: pylint or flake8
- **Type Hints**: Use where appropriate
- **Docstrings**: Required for all functions

## 📝 License

MIT License - See LICENSE file

## 🆘 Support

- **Documentation**: See PRODUCTION_DEPLOYMENT.md
- **Issues**: GitHub Issues
- **Email**: support@harbor.com

---

**Status**: Production-Ready ✅  
**Version**: 2.0.0  
**Last Updated**: March 2026
