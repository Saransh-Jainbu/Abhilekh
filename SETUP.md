# Quick Setup Guide

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed (`node --version`)
- PostgreSQL running (`psql --version`)
- Sarvam API Key from https://dashboard.sarvam.ai
- Google OAuth credentials from Google Cloud Console

## Step-by-Step Setup

### 1. Clone/Extract Project
```bash
cd "C:\Users\saran\OneDrive\Desktop\Sarvam Ai gov"
```

### 2. Set Up Environment Variables

**Backend**:
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Update these in `backend/.env`:
```
SARVAM_API_KEY=sk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=postgresql://postgres:password@localhost:5432/sarvam_docs
SESSION_SECRET=any_random_string_here
```

**Frontend**:
```bash
cd ../frontend
cp .env.example .env
# Edit .env with your credentials
```

Update these in `frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=...
```

### 3. Database Setup

Create database:
```bash
# On Windows, use psql (PostgreSQL CLI)
psql -U postgres
CREATE DATABASE sarvam_docs;
\q
```

Run migrations:
```bash
cd backend
npm install
node migrate.js
# Should see: ✓ Database schema initialized successfully
```

### 4. Start Backend

```bash
cd backend
npm run dev
# Should see: Server running on port 3001
```

### 5. Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
# Should see: Local: http://localhost:5173/
```

### 6. Access Application

Open browser: `http://localhost:5173`

You should see the login page. Click "Sign in with Google" to proceed.

## Verify Setup

1. **Backend Health Check**:
   ```bash
   curl http://localhost:3001/api/health
   # Should return: {"status":"ok"}
   ```

2. **Upload Test Document**:
   - Login with Google
   - Click "Upload New"
   - Select a PDF or image
   - Click "Process Document"
   - Watch status change from "pending" → "processing" → "completed"

3. **Check Insights**:
   - Once processing completes, insights should appear in sidebar

4. **Try Chat**:
   - Click on "Chat" tab
   - Ask a question about the document
   - Should get response within seconds

5. **Test Translation**:
   - Select a language (e.g., Hindi)
   - Click "Translate"
   - Wait for translation to complete
   - View translated text

## Common Issues & Fixes

### PostgreSQL Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix**: Start PostgreSQL service
- Windows: Services app → PostgreSQL → Start
- Or in terminal: `pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start`

### Sarvam API Error
```
Error: 401 Unauthorized
```
**Fix**: Check SARVAM_API_KEY in .env
- Get key from https://dashboard.sarvam.ai
- Ensure it starts with "sk_"

### Google OAuth Error
```
Error: invalid_client
```
**Fix**: Verify Google Cloud Console settings
- Check CLIENT_ID matches OAuth app
- Add http://localhost:5173 to authorized redirect URIs
- Add http://localhost:3001 to authorized origins

### Port Already in Use
```
Error: EADDRINUSE: address already in use :::3001
```
**Fix**: Change PORT in backend/.env or kill existing process
- Windows: `netstat -ano | findstr :3001`

### File Upload Size Exceeded
```
Error: File size exceeds 50MB limit
```
**Fix**: Upload a smaller file or modify LIMIT in `fileUpload.js`

## Development Tips

- **Hot Reload**: Both frontend and backend watch for changes
- **API Debugging**: Check browser DevTools → Network tab
- **Database Debugging**: Use `psql` to query: `SELECT * FROM documents;`
- **Logs**: Check server terminal for processing status

## Performance Notes

- First upload may take 30-60 seconds (includes extraction + insights + translations)
- Translation to 8 languages runs in parallel
- Chat responses generated in real-time (~3-5 seconds)

## Production Deployment

For production:
1. Use environment-specific `.env` files
2. Enable HTTPS/SSL
3. Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
4. Set up proper logging and monitoring
5. Use production-grade session store (not in-memory)
6. Configure CORS for your domain
7. Add rate limiting and authentication tokens
8. Use PM2 or similar for process management

## Getting Help

- Sarvam Docs: https://docs.sarvam.ai
- Express Docs: https://expressjs.com
- React Docs: https://react.dev
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Ready to demo?** Upload a government document PDF and watch Sarvam work its magic! 🚀
