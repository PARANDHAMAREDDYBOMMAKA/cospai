# CosPAI IDE - Quick Start

## ✅ What's Working

Your IDE is now fully functional like StackBlitz:

- ✅ **WebContainer** - Node.js runs in browser
- ✅ **Monaco Editor** - Full VS Code editor
- ✅ **Terminal** - Run npm commands
- ✅ **Preview** - Live preview of your app
- ✅ **Auto-Refresh** - Files sync every 5 seconds
- ✅ **File Tree** - Shows all files including node_modules
- ✅ **IndexedDB** - Fast cache for persistence

## 🚀 How to Use

### 1. Start the Server
```bash
npm run dev
```

### 2. Create/Open a Project
- Go to http://localhost:3000/dashboard
- Create a new project or open existing
- Opens the IDE

### 3. Create Files
**Option A - File Tree:**
- Click `+` button in FILES panel
- Enter filename (e.g., `index.js`)
- Press Create

**Option B - Terminal:**
```bash
touch index.js
echo "console.log('Hello')" > index.js
```

Files auto-refresh in 5 seconds or click refresh icon.

### 4. Edit Files
- Click any file in tree
- Edit in Monaco editor
- Auto-saves on change
- Cmd/Ctrl+S to force save

### 5. Install Packages
```bash
npm install
npm install react
npm install -D typescript
```

node_modules will appear in file tree.

### 6. Run Dev Server
```bash
npm run dev
```

Then click **"Show Preview"** button to see your app!

### 7. See Preview
- Click "Show Preview" in top bar
- Shows your running app
- Auto-detects ports: 5173 (Vite), 3000 (Next.js), etc.
- Opens in split view with editor

## 📁 File Structure

```
Files in WebContainer:
├── package.json
├── index.html
├── src/
│   ├── App.jsx
│   └── main.jsx
└── node_modules/  (visible!)
```

## 💾 How Files are Stored

```
Edit File
    ↓
WebContainer (instant)
    ↓
IndexedDB (1s cache)
    ↓
PostgreSQL (5s backup)
```

## 🎯 Features

### Auto-Sync
- Files created in terminal appear automatically (5s)
- Click refresh for instant sync

### Preview
- Auto-detects dev server
- Works with Vite, Next.js, React, etc.
- Hot reload on file changes
- Open in new tab

### Monaco Editor
- Syntax highlighting
- Auto-completion
- Error detection
- Cmd/Ctrl+S to save

### Terminal
- Full shell (jsh)
- npm, node, git commands
- Command history (arrow up)
- Multi-line support

## 🔧 Common Workflows

### Create React App
```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```
Click "Show Preview"

### Create Next.js App
```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```
Click "Show Preview"

### Just HTML/CSS/JS
```bash
touch index.html
touch styles.css
touch script.js
```

Edit in Monaco, files save automatically.

## 🐛 Troubleshooting

**Files not showing?**
- Wait 5 seconds for auto-refresh
- Or click refresh icon (↻)

**Preview not loading?**
- Make sure dev server is running
- Check terminal for errors
- Preview checks ports: 5173, 3000, 4173, 8080

**WebContainer error?**
- Use modern browser (Chrome 84+)
- Check HTTPS/localhost
- Headers already configured

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────┐
│ Back | CosPAI IDE | [Show Preview] [Save]      │
├──────┬──────────────────────┬───────────────────┤
│FILES │  MONACO EDITOR      │  PREVIEW          │
│      │                     │  (if enabled)     │
│ +  ↻ │  (Edit code here)   │                   │
│      │                     │  Your app runs    │
│file  │                     │  here!            │
│file  │                     │                   │
│folder│                     │                   │
│      │                     │                   │
├──────┴──────────────────────┴───────────────────┤
│ TERMINAL                                        │
│ > npm install                                   │
│ > npm run dev                                   │
└─────────────────────────────────────────────────┘
```

## 💡 Tips

1. **Save Often**: Cmd/Ctrl+S in editor
2. **Preview**: Works best with Vite (fast)
3. **Terminal**: Use `clear` to clean screen
4. **Files**: Auto-sync every 5s, or click ↻
5. **Cache**: IndexedDB keeps files offline

## 📚 What's Next?

Your IDE is complete and working! You can now:
- Install any npm packages
- Run any dev server
- See live preview
- Edit files with IntelliSense
- Terminal commands

Enjoy building! 🎉
