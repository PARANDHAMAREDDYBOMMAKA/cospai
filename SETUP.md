# CosPAI - Clean WebContainer IDE Setup

## Pure WebContainer Architecture

This IDE uses **WebContainer** for all file operations with **IndexedDB** for persistence. No database file storage!

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## How It Works

1. **WebContainer** - Browser-based Node.js runtime
   - All files live in WebContainer's virtual filesystem
   - Run `npm install`, `npm run dev` directly in terminal
   - Full Node.js environment in your browser

2. **IndexedDB Cache** - Persistent storage
   - Auto-saves files every 5 seconds
   - Survives browser refresh
   - Request persistent storage automatically

3. **No Database for Files** - Simplified!
   - Database only for projects metadata & auth
   - Files live in browser (WebContainer + IndexedDB)
   - Faster, simpler, better performance

## Features

### Multiple Terminal Sessions
- Click `+` to add new terminal
- Switch between terminals with tabs
- Each terminal is independent

### File Operations
- Create: Click `+` in file tree or use terminal
- Edit: Select file, edit in Monaco editor
- Save: Auto-saves on edit, or click Save button
- Delete: Right-click file → Delete

### Auto-Sync
- Files auto-sync to IndexedDB every 5 seconds
- Click refresh (↻) for manual sync
- File tree updates automatically

## Environment Variables

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Only needed for auth & project metadata. Files don't use database!

## Browser Support

- Chrome 84+
- Edge 84+
- Safari 15.2+

Requires:
- HTTPS (or localhost)
- COOP/COEP headers (already configured)

## Storage

- IndexedDB quota: Up to 60% of available disk
- Persistent storage requested automatically
- Files excluded from cache: node_modules, .git, dist, build

## FAQ

**Q: Where are my files?**
A: In WebContainer (browser memory) + IndexedDB cache

**Q: Will they persist?**
A: Yes! IndexedDB cache survives browser refresh

**Q: Can I install npm packages?**
A: Yes! Run `npm install` in terminal

**Q: Does it work offline?**
A: WebContainer needs initial load, then works offline

**Q: What about file size limits?**
A: IndexedDB quota is generous (60% of disk in Chrome)

## Troubleshooting

**Files not showing**: Wait 5 sec or click refresh (↻)

**WebContainer error**: Use modern browser, check COOP/COEP headers

**Storage full**: Clear old project caches in DevTools

## Architecture

```
┌─────────────────────────────────────┐
│  Monaco Editor (Code Editor)        │
│  ↓ ↑                                │
│  WebContainer (File System)         │
│  ↓ ↑                                │
│  IndexedDB (Persistent Cache)       │
└─────────────────────────────────────┘

Database:
└─ Only for: Projects, Users, Auth
