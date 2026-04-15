# Quick Start Guide - Python AI Workers

## ⚡ 5-Minute Setup

### 1. Install (One-Time Setup)
```powershell
cd python_worker
pip install -r requirements.txt
```

### 2. Configure
```powershell
# Copy template
Copy-Item .env.example .env

# Edit with your keys
notepad .env
```

**Minimum Required**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Test
```powershell
python test_workers.py
```

### 4. Run
```powershell
uvicorn main:app --reload --port 8000
```

### 5. Verify
```powershell
curl http://localhost:8000/health
```

## 📋 Common Commands

### Start Worker
```powershell
# Development (auto-reload)
uvicorn main:app --reload --port 8000

# Production (4 workers)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Check Status
```powershell
# Health check
Invoke-WebRequest http://localhost:8000/health

# Find running workers
Get-Process | Where-Object { $_.ProcessName -like "*python*" }

# Check port usage
netstat -ano | findstr :8000
```

### Stop Worker
```powershell
# Graceful (Ctrl+C in terminal)

# Force stop all Python processes
Get-Process python | Stop-Process -Force
```

### View Logs
```powershell
# If logging to file
Get-Content -Wait worker.log -Tail 50

# Filter errors only
Get-Content worker.log | Select-String "ERROR"
```

### Update Dependencies
```powershell
pip install --upgrade -r requirements.txt
```

## 🔑 Getting API Keys

### Google Gemini (Required)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy key → Paste in `.env` as `GEMINI_API_KEY`

### Supabase (Required)
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" secret key
4. Paste in `.env` as `SUPABASE_SERVICE_ROLE_KEY`

### O*NET (Optional)
1. Register at https://services.onetcenter.org/reference/
2. Get username and password
3. Add to `.env` as `ONET_USERNAME` and `ONET_PASSWORD`

## 🧪 Testing

### Run All Tests
```powershell
python test_workers.py
```

### Test Specific Worker
```powershell
# Resume analysis
curl -X POST http://localhost:8000/api/inngest -H "Content-Type: application/json" -d '{
  "name": "document/uploaded",
  "data": {
    "fileUrl": "url_here",
    "filePath": "path_here",
    "studentId": "id_here",
    "documentType": "resume"
  }
}'
```

## 🐛 Troubleshooting

### Worker Won't Start
```powershell
# Check Python version (need 3.10+)
python --version

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt

# Check for port conflicts
netstat -ano | findstr :8000
```

### "GEMINI_API_KEY not configured"
```powershell
# Check .env file exists
Test-Path .env

# Verify key is set
Get-Content .env | Select-String GEMINI

# If missing, get key from https://aistudio.google.com/app/apikey
```

### Database Errors
```powershell
# 1. Check database columns exist
# Run in Supabase SQL Editor:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' AND column_name IN ('resume_score', 'resume_feedback');

# 2. If missing, run migration:
# Execute: sql/add-resume-fields.sql
```

### Import Errors
```powershell
# Verify in python_worker directory
Get-Location

# Should show: ...\Harbor\python_worker

# If not:
cd python_worker
```

## 📊 Monitoring

### Check Worker Health
```powershell
# Simple check
Invoke-WebRequest http://localhost:8000/health

# Detailed check
python test_workers.py
```

### View API Docs
```powershell
# Open in browser
Start-Process http://localhost:8000/docs
```

### Monitor Resource Usage
```powershell
# Check memory
Get-Process python | Select-Object ProcessName, WS

# Check CPU
Get-Process python | Select-Object ProcessName, CPU
```

## 🚀 Production Deployment

### Quick Deploy to Railway
```powershell
# 1. Install Railway CLI
npm install -g railway

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add environment variables in Railway dashboard

# 5. Deploy
railway up
```

### Quick Deploy with Docker
```powershell
# Build
docker build -t harbor-worker .

# Run
docker run -d -p 8000:8000 --env-file .env --name harbor-worker harbor-worker

# Check logs
docker logs -f harbor-worker
```

## 📚 Documentation

- **Full Guide**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **README**: [README.md](README.md)
- **Upgrade Summary**: [UPGRADE_SUMMARY.md](UPGRADE_SUMMARY.md)

## ✅ Daily Checklist

- [ ] Worker is running (`http://localhost:8000/health`)
- [ ] No errors in logs
- [ ] Resume uploads completing successfully
- [ ] Database updates confirmed
- [ ] Health check passes

## 🆘 Need Help?

1. **Check logs** for error messages
2. **Run tests**: `python test_workers.py`
3. **Review documentation** in this folder
4. **Verify environment variables** in `.env`
5. **Check Supabase dashboard** for database issues

---

**Quick Reference Version**: 1.0  
**Last Updated**: March 2026
