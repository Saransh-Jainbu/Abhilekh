# Sarvam Government Document Digitizer

A modern application showcasing Sarvam's capabilities for digitizing legacy government documents with poor handwriting and regional language content.

## Features

- 📄 **Document Upload**: Upload PDF or image files of government documents
- 🔍 **Text Extraction**: Automatic text extraction using Sarvam Vision API
- 💡 **AI Insights**: Generate key insights using Sarvam 105B LLM
- 🌍 **Multilingual Translation**: Translate documents to 8 regional Indian languages (Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Marathi)
- 💬 **Smart Chat**: Ask questions about documents with context-aware responses
- 🔐 **Google Authentication**: Secure login with Google OAuth

## Tech Stack

- **Frontend**: React 18 + Vite + React Router + Axios
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **API Integration**: Sarvam SDK (Vision, 105B LLM, Translation)
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
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API client
│   │   ├── styles/              # Global styles
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
- `POST /api/documents/:id/process` - Start processing
- `GET /api/documents/:id/status` - Check processing status
- `GET /api/documents/:id/insights` - Get AI insights
- `POST /api/documents/:id/translate` - Translate to language
- `GET /api/documents/:id/translations` - List translations
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/chat/:documentId/message` - Send chat message
- `GET /api/chat/:documentId/history` - Get chat history

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
2. **Extract**: Sarvam Vision API extracts text from the image
3. **Analyze**: Sarvam 105B LLM generates key insights
4. **Translate**: Document is automatically translated to 8 regional languages
5. **Chat**: Users can ask questions about the document using AI
6. **Export**: View extracted text and translations

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
