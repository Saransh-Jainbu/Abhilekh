# Abhilekh — Sarvam Government Document Digitizer

A modern application showcasing Sarvam's capabilities for digitizing legacy government documents with poor handwriting and regional language content. *Abhilekh* (अभिलेख) means "record" or "archive."

## Features

- 📄 **Document Upload**: Upload PDF or image files of government documents
- 🔍 **Page-Aware OCR**: PDFs are split into individual pages and OCR'd **in parallel** via Sarvam Document Intelligence, so every page gets accurate, isolated text extraction
- 🖼️ **Side-by-Side Reader**: View each original page image on the left with its extracted/translated text on the right, navigating page-by-page with ← Prev / Next → controls
- 🌍 **Dual-Mode Translation**: Translate to 8 regional Indian languages with two views from one source:
  - **Per-page** translations aligned to each page image in the reader
  - **Flowing, archive-quality** translation where sentences that cross page breaks stay intact (reads as continuous prose, not chopped page blocks)
- 💡 **AI Insights**: Generate key insights using Sarvam 105B LLM
- 💬 **Streaming Chat**: Ask questions about documents and get context-aware answers streamed in real time (SSE), in your chosen language
- 🎨 **Editorial UI**: Warm, responsive design with a landing page, dashboard, and progress stepper — mobile-friendly throughout
- 🔐 **Google Authentication**: Secure login with Google OAuth

## Tech Stack

- **Frontend**: React 18 + Vite + React Router + Axios + react-pdf (pdfjs)
- **Backend**: Node.js + Express.js + pdf-lib (PDF page splitting)
- **Database**: PostgreSQL (JSONB for per-page text/translations)
- **API Integration**: Sarvam SDK (Document Intelligence, 105B LLM, Translation)
- **Authentication**: Google OAuth 2.0

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Utility functions
│   │   └── app.js               # Express app
│   ├── migrations/              # Database migrations
│   ├── uploads/                 # Uploaded files (created at runtime)
│   ├── server.js                # Server entry point
│   ├── migrate.js               # Migration runner
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Landing, Upload, DocumentList, DocumentViewer
│   │   ├── components/          # Navbar, ChatPanel, TranslationPanel,
│   │   │                        # PageReader (side-by-side), ProgressStepper
│   │   ├── services/            # API client
│   │   ├── styles/              # landing.css, app.css (design system)
│   │   ├── hooks/               # Custom hooks
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── public/                  # Static assets
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── .env.example                 # Environment variables template
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Sarvam API Key (from https://dashboard.sarvam.ai)
- Google OAuth 2.0 credentials

## Setup Instructions

### 1. Environment Configuration

Create `.env` files in both backend and frontend:

**Backend (`backend/.env`)**:
```bash
# Sarvam API
SARVAM_API_KEY=your_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/sarvam_docs

# Session
SESSION_SECRET=your_random_secret_key

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (`frontend/.env`)**:
```bash
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_client_id
```

### 2. Database Setup

Create PostgreSQL database:
```bash
createdb sarvam_docs
```

Run migrations:
```bash
cd backend
npm run migrate
```

### 3. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth callback
- `POST /api/auth/logout` - Logout

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents` - List user's documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/file` - Stream the original file (PDF/image) for the reader
- `POST /api/documents/:id/process` - Start processing
- `GET /api/documents/:id/status` - Check processing status
- `GET /api/documents/:id/insights` - Get AI insights
- `POST /api/documents/:id/translate` - Translate to language (flowing + per-page)
- `GET /api/documents/:id/translations` - List translations
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/documents/:id/chat` - Send chat message (SSE stream)
- `GET /api/documents/:id/chat` - Get chat history

## Supported Languages

- 🇮🇳 Hindi (hi)
- 🇮🇳 Tamil (ta)
- 🇮🇳 Telugu (te)
- 🇮🇳 Kannada (kn)
- 🇮🇳 Malayalam (ml)
- 🇮🇳 Bengali (bn)
- 🇮🇳 Punjabi (pa)
- 🇮🇳 Marathi (mr)

## How It Works

1. **Upload**: User uploads a PDF or image of a government document
2. **Split & Extract**: PDFs are split into individual pages with `pdf-lib`, then each page is sent to Sarvam Document Intelligence **in parallel** for accurate per-page OCR (inline base64 figures are stripped from the text)
3. **Translate**: Text is translated into the chosen language in two forms — per-page (aligned to each page image) and a flowing, archive-quality version where cross-page sentences stay intact
4. **Analyze**: Sarvam 105B LLM generates key insights from the translated text
5. **Read**: The side-by-side reader shows each page image beside its text, with page navigation
6. **Chat**: Users ask questions about the document and receive answers streamed in real time

## Development

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Dev Server
```bash
cd frontend
npm run dev
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

## Performance Considerations

- Documents are processed asynchronously after upload
- Large files (>50MB) are rejected
- Translation happens in parallel for all languages
- Chat responses are generated on-demand
- File uploads are temporarily stored in `backend/uploads/`

## Security

- Google OAuth 2.0 for authentication
- Session-based authorization
- Database queries use parameterized statements
- File upload validation (MIME type + size)
- CORS enabled for frontend origin
- Environment variables for sensitive data

## Troubleshooting

**Database Connection Error**
```
Check DATABASE_URL in .env and ensure PostgreSQL is running
```

**Sarvam API Errors**
```
Verify SARVAM_API_KEY is correct and has required permissions
Check API quota and rate limits
```

**Upload Fails**
```
Ensure file is PDF or valid image (JPG, PNG, GIF)
Check file size is under 50MB
Verify uploads/ directory exists
```

**Google OAuth Not Working**
```
Confirm GOOGLE_CLIENT_ID matches OAuth app configuration
Check FRONTEND_URL is in authorized redirect URIs
```

## Contributing

This is a demo application. Feel free to fork and modify for your use case.

## License

MIT

## Support

For issues with Sarvam APIs, visit: https://docs.sarvam.ai
For database issues, check: https://www.postgresql.org/docs/
