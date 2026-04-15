# Harbor Python Worker - Production Deployment Guide

## 🚀 Overview

The Harbor Python Worker is a FastAPI microservice that handles AI-powered background processing:
- **Resume Analysis** using Google Gemini AI
- **Profile Embeddings** using Sentence Transformers  
- **Fuzzy Logic Grading** for skill confidence
- **Taxonomy Syncing** from O*NET Web Services

## 📋 Prerequisites

### System Requirements
- **Python**: 3.10 or higher
- **RAM**: Minimum 2GB (4GB recommended for ML models)
- **Disk**: 2GB for dependencies and models
- **OS**: Windows, Linux, or macOS

### Required Services
- **Supabase** project with service role key
- **Inngest** account (for event orchestration)
- **Google Gemini API** key (free tier available)
- **O*NET** credentials (optional, for taxonomy sync)

## 🔧 Installation

### 1. Navigate to Worker Directory
```powershell
cd python_worker
```

### 2. Create Virtual Environment
```powershell
# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected install time**: 2-5 minutes (downloads ~1.5GB including ML models)

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for Production
INNGEST_SIGNING_KEY=your_inngest_signing_key
INNGEST_EVENT_KEY=your_inngest_event_key

# Required for Resume Analysis
GEMINI_API_KEY=your_gemini_api_key

# Optional
ONET_USERNAME=your_onet_username
ONET_PASSWORD=your_onet_password

# Settings
LOG_LEVEL=INFO
ENVIRONMENT=production
```

### 5. Get API Keys

#### Google Gemini API (Free)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy and paste into `.env`

#### Supabase Service Role Key
1. Go to Supabase Dashboard → Settings → API
2. Copy "service_role" key (NOT anon key)
3. Paste into `.env`

#### Inngest Keys
1. Go to https://www.inngest.com/
2. Create account and app
3. Copy signing key and event key
4. Paste into `.env`

## 🚦 Running the Worker

### Development Mode
```powershell
uvicorn main:app --reload --port 8000
```

### Production Mode
```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### With Logging
```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
```

### Background/Daemon Mode (Windows)
```powershell
Start-Process -FilePath "uvicorn" -ArgumentList "main:app --host 0.0.0.0 --port 8000 --workers 4" -WindowStyle Hidden
```

### Background Mode (Linux)
```bash
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 > worker.log 2>&1 &
```

## 🏥 Health Checks

### Check if Worker is Running
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" | Select-Object -ExpandProperty Content
```

Expected response:
```json
{"status":"healthy"}
```

### Check Inngest Integration
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/inngest" | Select-Object -ExpandProperty Content
```

### Test Resume Analysis (Manual Trigger)
```powershell
$body = @{
    name = "document/uploaded"
    data = @{
        fileUrl = "https://example.com/resume.pdf"
        filePath = "user-id/resume.pdf"
        studentId = "your-student-id"
        documentType = "resume"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/inngest" -Method POST -Body $body -ContentType "application/json"
```

## 📊 Monitoring & Logs

### View Real-time Logs
```powershell
# Windows (if running in window)
# Just watch the terminal

# Linux
tail -f worker.log
```

### Common Log Messages

✅ **Success Indicators**:
- `"Supabase client initialized successfully"`
- `"Embedding model loaded successfully"`
- `"Fuzzy logic system initialized successfully"`
- `"Resume analyzed successfully (Score: 75)"`

❌ **Error Indicators**:
- `"GEMINI_API_KEY not configured"` → Add API key to `.env`
- `"Supabase client not initialized"` → Check Supabase credentials
- `"Failed to load embedding model"` → Reinstall dependencies
- `"Database update failed"` → Check table schema

## 🐛 Troubleshooting

### Issue: Worker won't start
**Solution**: 
```powershell
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt

# Check for port conflicts
netstat -ano | findstr :8000
```

### Issue:  "GEMINI_API_KEY not configured"
**Solution**: Mock data will be used. This is okay for testing, but get a real key for production.

### Issue: "No text extracted from PDF"
**Solution**: PDF may be image-based. Ensure uploaded resumes are text-based PDFs.

### Issue: Database update fails
**Solution**: 
1. Check `resume_score` and `resume_feedback` columns exist in `students` table
2. Run the SQL migration: `sql/add-resume-fields.sql`
3. Verify service role key has write permissions

### Issue: Models downloading slowly
**Solution**: Models are cached after first download. Subsequent starts are fast.

## 🔒 Security Best Practices

### Never Commit Secrets
```powershell
# Ensure .env is in .gitignore
Add-Content .gitignore "`n.env"
Add-Content .gitignore "`n**/.env"
```

### Use Environment-Specific Keys
- **Development**: Use test Supabase project
- **Production**: Use production Supabase with RLS enabled

### Rotate Keys Regularly
- Gemini API: Regenerate monthly
- Supabase Service Role: Regenerate quarterly
- Inngest: Rotate on team changes

## 📦 Production Deployment Options

### Option 1: Railway.app (Recommended)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Option 2: Docker
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```powershell
docker build -t harbor-worker .
docker run -p 8000:8000 --env-file .env harbor-worker
```

### Option 3: AWS EC2/Azure VM
1. SSH into server
2. Follow installation steps above
3. Use systemd/supervisor for persistence
4. Configure nginx reverse proxy

### Option 4: Heroku
```powershell
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Deploy
heroku create harbor-python-worker
heroku config:set SUPABASE_URL=your_url
heroku config:set GEMINI_API_KEY=your_key
git push heroku main
```

## ⚡ Performance Optimization

### Increase Workers
```powershell
# For 4-core CPU
uvicorn main:app --workers 4

# For 8-core CPU  
uvicorn main:app --workers 8
```

### Enable Caching
Models are automatically cached after first load.

### Database Connection Pooling
Already configured in Supabase client.

## 📈 Scaling

### Horizontal Scaling
- Deploy multiple worker instances
- Use load balancer (nginx/Cloudflare)
- Inngest handles event distribution

### Vertical Scaling
- Increase RAM for larger ML models
- Use GPU for faster inference (optional)

## 🧪 Testing

### Run Manual Test
```powershell
# Start worker
uvicorn main:app --port 8000

# In new terminal
cd ..
pnpm dev

# Upload a resume through the UI
# Check worker terminal for logs
```

### Expected Flow
1. User uploads resume → Supabase Storage
2. Next.js triggers Inngest event
3. Worker downloads PDF
4. PyMuPDF extracts text
5. Gemini AI analyzes (10-15 seconds)
6. Results saved to database
7. Frontend polls and displays results

## 📞 Support

### Check Worker Status
```powershell
GET http://localhost:8000/
```

### Check Inngest Connection
```powershell
GET http://localhost:8000/api/inngest
```

### View All Routes
```powershell
GET http://localhost:8000/docs
```

## ✅ Production Checklist

- [ ] All environment variables configured
- [ ] Gemini API key is valid
- [ ] Supabase service role key is correct
- [ ] Database has `resume_score` and `resume_feedback` columns
- [ ] Worker starts without errors
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Resume upload test completes successfully
- [ ] Logs show "Resume analyzed successfully"
- [ ] Database updates confirmed
- [ ] Frontend displays analysis results

## 🎯 Next Steps

1. **Monitor Performance**: Check Inngest dashboard for event processing times
2. **Set Up Alerts**: Configure uptime monitoring (UptimeRobot, Pingdom)
3. **Enable Auto-restart**: Use PM2, systemd, or Docker restart policies
4. **Review Logs**: Check daily for errors or performance issues
5. **Update Dependencies**: Run `pip list --outdated` monthly

---

**Worker Status**: Production-Ready ✅  
**Last Updated**: March 2026  
**Version**: 2.0.0
