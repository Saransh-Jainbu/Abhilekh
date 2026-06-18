# Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│                    localhost:5173 (Vite)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Login Page (Google OAuth)                            │   │
│  │  • Upload Zone (Drag & Drop)                            │   │
│  │  • Document List                                        │   │
│  │  • Document Viewer (Tabs: Original, Extracted, Chat)    │   │
│  │  • Insights Panel                                       │   │
│  │  • Chat Interface                                       │   │
│  │  • Translation Selector                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────────────────────────────────────┘
            │ HTTP/REST (axios)
            │ Session: X-Session-ID header (JWT)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                Backend (Node.js + Express)                      │
│                  localhost:3001                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes Layer                                           │   │
│  │  • POST /api/auth/google (Authentication)              │   │
│  │  • POST /api/documents (Upload)                        │   │
│  │  • GET  /api/documents (List)                          │   │
│  │  • POST /api/documents/:id/process (Async)            │   │
│  │  • POST /api/chat/:id/message                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                      ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Controllers Layer                                      │   │
│  │  • authController.js                                    │   │
│  │  • documentController.js                                │   │
│  │  • chatController.js                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                      ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services Layer                                         │   │
│  │  • sarvamService.js (Vision, 105B, Translation)        │   │
│  │  • documentService.js (DB Operations)                  │   │
│  │  • processService.js (Async Orchestration)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────┬───────────────────────┬───────────────────────────┬─────────┘
     │                       │                           │
     │ File I/O            │ SQL Queries             │ REST Calls
     │                       │                           │
     ▼                       ▼                           ▼
┌──────────────┐    ┌──────────────────┐      ┌──────────────────┐
│   File       │    │    PostgreSQL    │      │   Sarvam API    │
│   System     │    │                  │      │                 │
│ /uploads     │    │ • users          │      │ • Vision API    │
│              │    │ • documents      │      │ • 105B Chat     │
│              │    │ • insights       │      │ • Translation   │
│              │    │ • translations   │      │                 │
│              │    │ • chat_messages  │      │                 │
└──────────────┘    └──────────────────┘      └──────────────────┘
```

## Data Flow

### Document Upload Flow
```
User Upload
    ↓
POST /api/documents (multipart)
    ↓
Multer Middleware → Validate → Save to /uploads
    ↓
documentController.uploadDocument()
    ↓
documentService.createDocument()
    ↓
INSERT into PostgreSQL
    ↓
Response: { id, filename, status: 'pending' }
```

### Document Processing Flow
```
Click "Process Document"
    ↓
POST /api/documents/:id/process
    ↓
documentController.processDoc()
    ↓
setImmediate() → Async Processing Starts
    ├─→ Sarvam Vision: Extract Text
    │       ├─→ Read file from /uploads
    │       ├─→ Convert to base64
    │       └─→ Call Sarvam Vision API
    │           └─→ updateDocumentText()
    │
    ├─→ Sarvam 105B: Generate Insights
    │       └─→ chatWithDocument(text, [])
    │           └─→ createInsight()
    │
    └─→ Sarvam Translation: All Languages (Parallel)
            ├─→ translateText(text, 'hi')
            ├─→ translateText(text, 'ta')
            ├─→ ... 8 total languages
            └─→ createTranslation() for each
    ↓
Update Status: 'completed'
```

### Chat Flow
```
User Types Message
    ↓
POST /api/chat/:documentId/message
    ↓
Save User Message to DB
    ↓
Retrieve Previous Chat History
    ↓
Call Sarvam 105B with:
    • System: Document context
    • Previous messages
    • New user message
    ↓
Get Response
    ↓
Save Assistant Message to DB
    ↓
Return Latest Message
    ↓
Frontend Polls /chat/:id/history
    ↓
Display in Chat UI
```

## Authentication Flow

```
Frontend (LoginPage)
    ↓
GoogleLogin Component
    ↓
User approves in Google popup
    ↓
Receive ID Token
    ↓
POST /api/auth/google { token }
    ↓
Backend: verifyIdToken() using Google Auth Library
    ↓
Extract: { email, googleId }
    ↓
Check if user exists in DB
    ├─ No: CREATE new user
    └─ Yes: Use existing user
    ↓
Generate JWT Token (signed with SESSION_SECRET)
    ↓
Response: { sessionId: JWT, user: {...} }
    ↓
Frontend: localStorage.setItem('sessionId', JWT)
    ↓
All Subsequent Requests: Include X-Session-ID header
    ↓
Backend: Verify JWT in authMiddleware
```

## File Structure

### Backend Organization
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection pool
│   │   └── sarvam.js            # Sarvam API client
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   │
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── documents.js         # Document CRUD routes
│   │   └── chat.js              # Chat routes
│   │
│   ├── controllers/
│   │   ├── authController.js    # Google OAuth logic
│   │   ├── documentController.js # Upload, list, process
│   │   └── chatController.js    # Chat logic
│   │
│   ├── services/
│   │   ├── sarvamService.js     # Sarvam API calls
│   │   ├── documentService.js   # Database operations
│   │   └── processService.js    # Orchestration
│   │
│   ├── utils/
│   │   └── fileUpload.js        # Multer configuration
│   │
│   └── app.js                   # Express app setup
│
├── migrations/
│   └── 001_init_schema.sql      # Database schema
│
├── uploads/                     # File uploads (gitignored)
├── server.js                    # Server entry point
├── migrate.js                   # Migration runner
├── .env                         # Environment variables
└── package.json
```

### Frontend Organization
```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx        # Google OAuth login
│   │   ├── UploadPage.jsx       # Document upload
│   │   ├── DocumentListPage.jsx # Documents grid
│   │   └── DocumentViewerPage.jsx # View + chat + translate
│   │
│   ├── components/
│   │   ├── FileUploadZone.jsx   # Drag & drop upload
│   │   ├── DocumentCard.jsx     # Document list item
│   │   ├── InsightsPanel.jsx    # AI insights display
│   │   ├── ChatPanel.jsx        # Chat interface
│   │   ├── TranslationPanel.jsx # Language selector
│   │   └── Navbar.jsx           # Top navigation
│   │
│   ├── services/
│   │   └── api.js               # Axios client + endpoints
│   │
│   ├── styles/
│   │   └── globals.css          # Minimalist styling
│   │
│   ├── App.jsx                  # Router setup
│   ├── main.jsx                 # React entry point
│   └── index.html
│
├── public/                      # Static assets
├── vite.config.js               # Vite configuration
├── package.json
└── .env
```

## Database Schema

### users
```
id (SERIAL PRIMARY KEY)
email (VARCHAR UNIQUE)
google_id (VARCHAR UNIQUE)
created_at (TIMESTAMP)
```

### documents
```
id (SERIAL PRIMARY KEY)
user_id (FK → users.id)
filename (VARCHAR)
file_path (VARCHAR)
original_text (TEXT)
status (VARCHAR: pending/processing/completed/failed)
extracted_at (TIMESTAMP)
processed_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### insights
```
id (SERIAL PRIMARY KEY)
document_id (FK → documents.id)
insights_text (TEXT)
generated_at (TIMESTAMP)
```

### translations
```
id (SERIAL PRIMARY KEY)
document_id (FK → documents.id)
language (VARCHAR: 'hi', 'ta', 'te', etc.)
translated_text (TEXT)
created_at (TIMESTAMP)
UNIQUE(document_id, language)
```

### chat_messages
```
id (SERIAL PRIMARY KEY)
document_id (FK → documents.id)
user_id (FK → users.id)
role (VARCHAR: 'user' or 'assistant')
content (TEXT)
created_at (TIMESTAMP)
```

## API Response Format

### Success Response
```json
{
  "id": 123,
  "filename": "document.pdf",
  "status": "completed",
  "created_at": "2026-06-18T10:30:00Z"
}
```

### Error Response
```json
{
  "error": "Document not found"
}
```

## Async Processing

Document processing is **non-blocking**:
1. Frontend receives immediate response with document ID
2. Backend starts processing asynchronously in background
3. Frontend polls `/documents/:id/status` every 2 seconds
4. When status changes to 'completed', frontend reloads data

This allows users to continue working while processing happens.

## Performance Optimization

1. **Parallel Translations**: All 8 languages translated simultaneously
2. **Async I/O**: File operations don't block request handler
3. **Database Indexing**: Indexes on foreign keys and status
4. **Connection Pooling**: PostgreSQL pool reuses connections
5. **File Compression**: Consider gzip for large responses
6. **Caching**: Could add Redis for repeated translations

## Security Measures

1. **Authentication**: Google OAuth + JWT tokens
2. **Authorization**: Users can only access their documents
3. **Input Validation**: File type/size validation
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS**: Configured for frontend origin only
6. **Environment Variables**: Sensitive data not in code
7. **User Isolation**: Row-level security via SQL queries
