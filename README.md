
# CosPAI - Collaborative Cloud IDE + Learning Platform

> A full-featured collaborative cloud IDE with AI-powered assistance, real-time collaboration, and an integrated learning platform for all tech stacks.

🌐 **Built entirely on FREE tier services** | 🚀 **Production-ready architecture** | 🤖 **AI-powered**

---

## 🎯 What We're Building

A comprehensive web-based development platform featuring:
- ✅ **Collaborative IDE** - Monaco Editor (VS Code engine) + integrated terminal
- ✅ **Real-time Collaboration** - Google Docs-style simultaneous code editing
- ✅ **AI Assistant** - Code explanations, fixes, and voice-powered help
- ✅ **Video/Voice Chat** - Built-in communication for pair programming
- ✅ **Learning Platform** - Interactive courses with auto-grading for multiple tech stacks
- ✅ **100% Free MVP** - Built entirely on free-tier services!

---

## ⚡ Quick Start

### Prerequisites
```bash
Node.js 20+
PostgreSQL (Supabase/Neon)
Redis (Upstash)
```

### Installation

```bash
# 1. Install dependencies
npm install @prisma/adapter-neon @neondatabase/serverless
npm install

# 2. Setup environment variables (see .env.example)
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
npx prisma generate
npx prisma db push

# 4. Run development server
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📋 Implementation Status

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Backend: Prisma + PostgreSQL + Redis + R2
- [x] Authentication: NextAuth v5
- [x] REST APIs: Projects & Files
- [x] Monaco Editor Component
- [x] Terminal Component (xterm.js)
- [x] File Tree Navigator
- [x] Dashboard & Auth Pages
- [x] AI Clients (Groq + ElevenLabs)

### 🔄 Phase 2: Collaboration (IN PROGRESS)
- [ ] WebSocket server for terminal
- [ ] Yjs real-time editing
- [ ] User presence indicators
- [ ] Shared terminals

### 📋 Phase 3: Communication
- [ ] Daily.co video integration
- [ ] Voice/video controls
- [ ] Screen sharing

### 📋 Phase 4: AI Features
- [ ] AI Assistant UI
- [ ] Code explanation API
- [ ] Voice commands
- [ ] Screen reader

### 📋 Phase 5: Learning Platform
- [ ] Course management
- [ ] Interactive challenges
- [ ] Auto-grading
- [ ] Progress tracking

### 📋 Phase 6: Code Execution
- [ ] WebContainers (Node.js)
- [ ] Pyodide (Python)
- [ ] Multi-language support

---

## 🏗️ Architecture

```
Frontend (Next.js 14+)
├── Monaco Editor (VS Code)
├── xterm.js Terminal
├── Yjs Collaboration
├── Daily.co Video
└── Tailwind CSS + shadcn/ui

Backend (Node.js)
├── Express + Socket.io
├── Prisma ORM
├── PostgreSQL
├── Redis (Upstash)
└── Cloudflare R2

AI Services
├── Groq (LLM)
├── ElevenLabs (TTS)
└── WebContainers (Code Execution)
```

---

## 🗄️ Database Schema

**Core Models:**
- User, Project, File, Folder
- WorkspaceAccess, Terminal

**Learning Platform:**
- Course, Lesson, Challenge
- Submission, Enrollment, Progress

[View full schema](./prisma/schema.prisma)

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/[...nextauth]
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/[projectId]
PUT    /api/projects/[projectId]
DELETE /api/projects/[projectId]
```

### Files
```
GET    /api/projects/[projectId]/files
POST   /api/projects/[projectId]/files
GET    /api/projects/[projectId]/files/[fileId]
PUT    /api/projects/[projectId]/files/[fileId]
DELETE /api/projects/[projectId]/files/[fileId]
```

---

## 🆓 Free Tier Services

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| **Vercel** | 100GB bandwidth/month | Hosting |
| **Supabase** | 0.5GB database | PostgreSQL |
| **Upstash** | 500K commands/month | Redis |
| **Cloudflare R2** | 10GB storage | File storage |
| **Daily.co** | 10K minutes/month | Video chat |
| **ElevenLabs** | 10K chars/month | Text-to-speech |
| **Groq** | 14,400 requests/day | AI inference |
| **WebContainers** | Free for open source | Code execution |

**Total Monthly Cost: $0** 🎉

---

## 📦 Project Structure

```
cospai/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── dashboard/                  # Projects dashboard
│   │   ├── editor/[projectId]/         # IDE interface
│   │   ├── auth/                       # Authentication
│   │   └── api/                        # API routes
│   ├── components/
│   │   ├── editor/                     # Monaco, Terminal, FileTree
│   │   ├── ai/                         # AI assistant
│   │   └── video/                      # Video chat
│   └── lib/
│       ├── prisma.ts                   # Database
│       ├── redis.ts                    # Cache
│       ├── storage.ts                  # R2 storage
│       ├── auth.ts                     # NextAuth
│       └── ai/                         # Groq + ElevenLabs
├── prisma/
│   └── schema.prisma                   # Database schema
└── README.md                           # You are here
```

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="cospai"

# AI
ELEVENLABS_API_KEY="..."
GROQ_API_KEY="..."

# Video
NEXT_PUBLIC_DAILY_API_KEY="..."
DAILY_API_KEY="..."
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
# ... (add all env vars)
```

---

## 🛣️ Roadmap

### Milestone 1: MVP ✅ (Weeks 1-8)
Single-user IDE with auth and file management

### Milestone 2: Collaboration (Weeks 9-12)
Real-time editing, video chat, shared terminals

### Milestone 3: AI (Weeks 13-16)
Code assistant, voice commands, explanations

### Milestone 4: Learning (Weeks 17-22)
Courses, challenges, auto-grading

### Milestone 5: Execution (Weeks 23-24)
In-browser code running

### Milestone 6: Production (Weeks 25-26)
Performance, security, monitoring

---

## 🔐 Security

- ✅ JWT with httpOnly cookies
- ✅ Bcrypt password hashing
- ✅ RBAC for workspace access
- ✅ Input validation & sanitization
- ✅ Rate limiting
- ✅ Sandboxed code execution

---

## 📊 Tech Stack Details

**Why Monaco Editor?**
- Same engine as VS Code
- 60+ language support
- IntelliSense, syntax highlighting
- Keyboard shortcuts

**Why Yjs?**
- CRDT-based (no conflicts)
- Battle-tested (used by Notion, Figma)
- Real-time sync

**Why Groq?**
- 300+ tokens/second
- Free tier with high limits
- OpenAI-compatible API

---

## 🤝 Contributing

Contributions welcome! (Add guidelines when open-sourcing)

---

## 📄 License

(Add license)

---

## 🙏 Built With

- [Next.js](https://nextjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Prisma](https://www.prisma.io/)
- [xterm.js](https://xtermjs.org/)
- [Yjs](https://yjs.dev/)
- [Daily.co](https://www.daily.co/)
- [Groq](https://groq.com/)
- [ElevenLabs](https://elevenlabs.io/)

---

**Made with ❤️ for developers who code together**
