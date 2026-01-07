# CosPAI IDE - Production Architecture

Based on [StackBlitz WebContainers](https://blog.stackblitz.com/posts/introducing-webcontainers/) and [CodeSandbox](https://codesandbox.io/docs/learn/browser-sandboxes/overview) architectures.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Tab                             │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Monaco     │  │ File Tree    │  │ Live Preview       │  │
│  │ Editor     │  │ (UI)         │  │ (iframe)           │  │
│  └────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│       │                 │                    │              │
│  ┌────┴─────────────────┴────────────────────┴───────────┐  │
│  │           WebContainer Instance                        │  │
│  │  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐ │  │
│  │  │ File System  │  │ Terminal │  │ Dev Server      │ │  │
│  │  │ (Virtual FS) │  │ (jsh)    │  │ (localhost:300) │ │  │
│  │  └──────┬───────┘  └────┬─────┘  └────────┬────────┘ │  │
│  └─────────┼────────────────┼──────────────────┼──────────┘  │
│  ┌─────────┴────────────────┴──────────────────┴──────────┐  │
│  │           Service Worker (Network)                     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           IndexedDB Cache (Fast Access)                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ▲ │
                          │ │ Sync on Save
                          │ │ Load on Boot
                          │ ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  (Persistence│
                    │   + Backup)  │
                    └──────────────┘
```

## Core Components

### 1. WebContainer (Browser Runtime)
- **Node.js in Browser**: Full Node.js environment via WebAssembly
- **Virtual File System**: Linux-style filesystem in memory
- **Process Management**: Run npm, node, dev servers
- **Network Stack**: Virtualized TCP via Service Workers
- **Security**: All code runs in browser sandbox

**Key Features:**
- `npm install` works natively
- `npm run dev` starts dev server
- File system operations (read/write/mkdir)
- 10x faster than local (according to StackBlitz)

**Sources:**
- [WebContainers Introduction](https://blog.stackblitz.com/posts/introducing-webcontainers/)
- [WebContainer API Docs](https://webcontainers.io/)

### 2. Database (PostgreSQL) - Persistence Layer
Used for:
- **Project metadata** (name, description, owner)
- **File snapshots** (backup on save)
- **User authentication** (NextAuth)
- **Share/collaboration** (future)

**NOT used for:**
- Active file operations (WebContainer handles this)
- Real-time editing (WebContainer FS is source of truth)

### 3. IndexedDB - Browser Cache
Used for:
- **Quick project loading** (cache files locally)
- **Offline access** (work without server)
- **Auto-save buffer** (save edits before DB sync)

### 4. File System Flow

**Loading a Project:**
```
1. User opens project
2. Load files from DB
3. Cache in IndexedDB
4. Mount to WebContainer
5. Ready to edit!
```

**Editing Files:**
```
1. User types in Monaco
2. Update WebContainer FS immediately
3. Debounced save to IndexedDB (1s)
4. Periodic sync to DB (5s or on explicit save)
```

**Creating Files (Terminal):**
```
1. User runs: touch newfile.js
2. WebContainer creates file
3. File watcher detects change
4. Auto-sync to IndexedDB → DB
5. UI updates file tree
```

### 5. Monaco Editor
- **Full IntelliSense**: TypeScript definitions
- **Syntax Highlighting**: 60+ languages
- **Auto-completion**: Import suggestions
- **Error Detection**: Red squiggly lines
- **Multi-file tabs**: Switch between files
- **Vim mode**: Optional keyboard bindings

### 6. Integrated Terminal
- **Shell**: jsh (JavaScript shell in WebContainer)
- **Commands**: npm, node, git, etc.
- **Multiple sessions**: Tabs for multiple terminals
- **Auto-complete**: Command suggestions
- **History**: Arrow up for previous commands

### 7. Live Preview
- **Dev Server**: WebContainer runs dev server (e.g., Vite, Next.js)
- **Hot Reload**: Changes reflect immediately
- **iframe**: Preview in sandboxed iframe
- **URL Access**: Get shareable preview URL
- **Console**: View browser console logs

## Data Flow

### Project Load Sequence
```
1. User clicks "Open Project"
2. API fetches project files from PostgreSQL
3. Files cached in IndexedDB (for fast future access)
4. WebContainer boots (if not already running)
5. Files mounted to WebContainer virtual FS
6. Monaco editor loads first file
7. Terminal becomes ready
8. Preview pane waits for dev server
```

### File Edit Sequence
```
1. User types in Monaco
2. onChange debounced (300ms)
3. WebContainer.fs.writeFile() updates virtual FS
4. IndexedDB update queued (1s debounce)
5. Background sync to PostgreSQL (every 5s)
6. If dev server running, hot reload triggered
7. Preview updates automatically
```

### Terminal Command Sequence
```
1. User types: npm install react
2. Terminal sends to WebContainer shell
3. WebContainer executes npm install
4. Downloads from npm registry via Service Worker
5. Installs to node_modules in virtual FS
6. File watcher detects new files
7. Auto-sync large folders to DB (debounced)
```

## Sync Strategy

### Optimistic Updates
- **UI updates immediately** (no waiting for server)
- **WebContainer is source of truth** (for active session)
- **DB syncs in background** (periodic + on save)

### Conflict Resolution
- **Single user for now**: No conflicts
- **Future collaboration**: Use CRDTs (Yjs) like Figma

### What Gets Synced
**Always sync:**
- Source code files (.js, .ts, .css, etc.)
- Config files (package.json, tsconfig.json)
- README, documentation

**Never sync:**
- node_modules (too large, reinstall from package.json)
- .git (use separate git storage)
- dist/build folders (regenerate)
- .env (security risk)

**Smart sync:**
- Binary files: Store in R2/S3, reference in DB
- Large files (>1MB): Compress before saving

## Performance Optimizations

### 1. Lazy Loading
- Load only visible files initially
- Load node_modules on demand
- Lazy load editor for unopened files

### 2. Debouncing
- Editor onChange: 300ms debounce
- IndexedDB save: 1s debounce
- DB sync: 5s debounce or explicit save

### 3. Caching
- IndexedDB cache for instant load
- Service Worker cache for static assets
- Monaco editor loaded once per session

### 4. Virtualization
- File tree: Virtualize large folders
- Terminal: Virtual scrollback buffer
- Editor: Only render visible lines

## Security

### Browser Sandbox
- All code runs in WebContainer sandbox
- Isolated from host system
- No access to user's filesystem
- Network requests via Service Worker

### Authentication
- NextAuth for user sessions
- JWT tokens in httpOnly cookies
- CSRF protection

### Code Isolation
- Each project in separate WebContainer (future)
- For now: Single WebContainer per user
- Service Worker isolates network

## Deployment

### Server Requirements
- **HTTPS required** (for Service Workers)
- **COOP/COEP headers** (for SharedArrayBuffer)
- **Next.js server** (already configured)

### Headers (already in server.js):
```javascript
'Cross-Origin-Embedder-Policy': 'require-corp'
'Cross-Origin-Opener-Policy': 'same-origin'
```

### Database
- PostgreSQL for persistence
- Prisma ORM for queries
- Migration scripts for schema changes

## Future Enhancements

### Phase 2: Collaboration
- Real-time editing with Yjs
- Cursor positions
- User presence
- Chat

### Phase 3: Git Integration
- Commit from browser
- GitHub integration
- Branch management
- Merge conflicts

### Phase 4: Deployment
- Deploy to Vercel from IDE
- Preview deployments
- Environment variables UI

## Tech Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | WebContainer | Node.js in browser |
| **Editor** | Monaco | VS Code editor engine |
| **Terminal** | xterm.js | Terminal emulator |
| **File Tree** | React | Custom component |
| **Database** | PostgreSQL | Persistence |
| **Cache** | IndexedDB | Browser storage |
| **Auth** | NextAuth v5 | Authentication |
| **Framework** | Next.js 14+ | React framework |
| **ORM** | Prisma | Database queries |
| **Styling** | Tailwind CSS | UI styling |

## References

- [StackBlitz WebContainers](https://blog.stackblitz.com/posts/introducing-webcontainers/)
- [WebContainer API](https://webcontainers.io/)
- [CodeSandbox Browser Sandboxes](https://codesandbox.io/docs/learn/browser-sandboxes/overview)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
