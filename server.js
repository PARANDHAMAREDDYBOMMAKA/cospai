const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const pty = require('node-pty')
const os = require('os')
const fs = require('fs')
const fsp = require('fs').promises
const path = require('path')
const chokidar = require('chokidar')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Store active terminal sessions
const terminals = new Map()

// Store file watchers
const fileWatchers = new Map()

// Store Yjs documents for persistence
const yjsDocs = new Map()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Add COOP and COEP headers for WebContainer support
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Terminal namespace
  io.of('/terminal').on('connection', (socket) => {
    console.log('Terminal client connected:', socket.id)

    socket.on('create-terminal', ({ projectId }) => {
      console.log('Creating terminal for project:', projectId)

      // Create project workspace directory
      const workspaceRoot = path.join(process.cwd(), 'workspaces')
      const projectDir = path.join(workspaceRoot, projectId)

      // Ensure workspace directory exists
      if (!fs.existsSync(workspaceRoot)) {
        fs.mkdirSync(workspaceRoot, { recursive: true })
      }

      // Ensure project directory exists
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true })
      }

      // Determine shell and args based on OS
      let shell
      let shellArgs = []

      if (os.platform() === 'win32') {
        shell = 'powershell.exe'
      } else {
        // Try to find a working shell with better detection
        const possibleShells = [
          '/bin/bash',
          '/bin/sh',
          process.env.SHELL, // User's preferred shell
          '/bin/zsh',
          '/usr/bin/bash',
          '/usr/bin/sh',
        ]

        // Check which shell exists
        shell = null
        for (const testShell of possibleShells) {
          if (testShell && fs.existsSync(testShell)) {
            shell = testShell
            break
          }
        }

        if (!shell) {
          console.error('No shell found!')
          socket.emit('output', '\r\n\x1b[31mError: No shell found on system\x1b[0m\r\n')
          socket.emit('ready')
          return
        }

        // No shell args to avoid issues
        shellArgs = []
      }

      console.log('Spawning shell:', shell, 'with args:', shellArgs, 'in directory:', projectDir)

      // Create a new PTY process in the project directory with error handling
      let ptyProcess
      try {
        // Create a minimal clean environment
        const cleanEnv = {
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          HOME: process.env.HOME || os.homedir(),
          USER: process.env.USER || os.userInfo().username,
          SHELL: shell,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
          LANG: process.env.LANG || 'en_US.UTF-8',
          LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
        }

        // Verify the shell is executable
        try {
          fs.accessSync(shell, fs.constants.X_OK)
        } catch (accessError) {
          console.error('Shell not executable:', shell, accessError)
          socket.emit('output', `\r\n\x1b[31mError: Shell ${shell} is not executable\x1b[0m\r\n`)
          socket.emit('ready')
          return
        }

        console.log('PTY spawn config:', { shell, shellArgs, cwd: projectDir, cols: 80, rows: 30 })

        ptyProcess = pty.spawn(shell, shellArgs, {
          name: 'xterm-256color',
          cols: 80,
          rows: 30,
          cwd: projectDir,
          env: cleanEnv,
        })

        console.log('PTY spawned successfully, PID:', ptyProcess.pid)
      } catch (error) {
        console.error('Failed to spawn shell:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          shell,
          shellArgs,
          cwd: projectDir,
        })

        // Try a fallback with even simpler configuration
        console.log('Trying fallback PTY configuration...')
        try {
          ptyProcess = pty.spawn('/bin/sh', [], {
            name: 'xterm',
            cols: 80,
            rows: 30,
            cwd: projectDir,
          })
          console.log('Fallback PTY spawned successfully, PID:', ptyProcess.pid)
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          socket.emit('output',
            `\r\n\x1b[31mError: Could not start terminal\x1b[0m\r\n` +
            `\r\n\x1b[33mThis may be due to macOS security restrictions.\x1b[0m\r\n` +
            `\r\n\x1b[33mTry running: sudo /usr/libexec/repair_packages --verify --standard-pkgs --volume /\x1b[0m\r\n` +
            `\r\nor rebuild node-pty: npm rebuild node-pty\r\n\r\n`
          )
          socket.emit('ready')
          return
        }
      }

      // Store the terminal session
      terminals.set(socket.id, ptyProcess)

      // Send data from PTY to client
      ptyProcess.onData((data) => {
        socket.emit('output', data)
      })

      // Handle PTY exit
      ptyProcess.onExit(({ exitCode }) => {
        console.log('Terminal exited with code:', exitCode)
        terminals.delete(socket.id)
        socket.emit('exit', exitCode)
      })

      // Let client know terminal is ready
      socket.emit('ready')

      console.log('Terminal ready for project:', projectId)
    })

    // Handle input from client
    socket.on('input', (data) => {
      const ptyProcess = terminals.get(socket.id)
      if (ptyProcess) {
        ptyProcess.write(data)
      }
    })

    // Handle resize
    socket.on('resize', ({ cols, rows }) => {
      const ptyProcess = terminals.get(socket.id)
      if (ptyProcess) {
        ptyProcess.resize(cols, rows)
      }
    })

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log('Terminal client disconnected:', socket.id)
      const ptyProcess = terminals.get(socket.id)
      if (ptyProcess) {
        ptyProcess.kill()
        terminals.delete(socket.id)
      }
    })
  })

  // Yjs collaboration namespace
  io.of('/yjs').on('connection', (socket) => {
    console.log('Yjs client connected:', socket.id)

    socket.on('join-room', ({ projectId, fileId }) => {
      const room = `${projectId}:${fileId}`
      socket.join(room)
      console.log(`Client ${socket.id} joined room ${room}`)

      // Broadcast to others in the room
      socket.to(room).emit('user-joined', {
        userId: socket.id,
        timestamp: Date.now(),
      })
    })

    socket.on('leave-room', ({ projectId, fileId }) => {
      const room = `${projectId}:${fileId}`
      socket.leave(room)
      console.log(`Client ${socket.id} left room ${room}`)

      socket.to(room).emit('user-left', {
        userId: socket.id,
        timestamp: Date.now(),
      })
    })

    // Forward Yjs sync messages
    socket.on('sync-step-1', ({ projectId, fileId, data }) => {
      const room = `${projectId}:${fileId}`
      socket.to(room).emit('sync-step-1', { userId: socket.id, data })
    })

    socket.on('sync-step-2', ({ projectId, fileId, data }) => {
      const room = `${projectId}:${fileId}`
      socket.to(room).emit('sync-step-2', { userId: socket.id, data })
    })

    socket.on('update', ({ projectId, fileId, data }) => {
      const room = `${projectId}:${fileId}`
      socket.to(room).emit('update', { userId: socket.id, data })
    })

    // User awareness (cursor position, selection, etc.)
    socket.on('awareness', ({ projectId, fileId, data }) => {
      const room = `${projectId}:${fileId}`
      socket.to(room).emit('awareness', { userId: socket.id, data })
    })

    socket.on('disconnect', () => {
      console.log('Yjs client disconnected:', socket.id)
    })
  })

  // File system watcher namespace
  io.of('/fs').on('connection', (socket) => {
    console.log('File system client connected:', socket.id)

    socket.on('watch-project', ({ projectId }) => {
      console.log('Watching project:', projectId)

      const projectDir = path.join(process.cwd(), 'workspaces', projectId)

      // Ensure directory exists
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true })
      }

      // Create watcher if it doesn't exist for this project
      if (!fileWatchers.has(projectId)) {
        const watcher = chokidar.watch(projectDir, {
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100
          }
        })

        watcher
          .on('add', (filePath) => {
            const relativePath = path.relative(projectDir, filePath)
            console.log('File added:', relativePath)
            io.of('/fs').to(projectId).emit('file-added', {
              path: relativePath,
              projectId
            })
          })
          .on('change', (filePath) => {
            const relativePath = path.relative(projectDir, filePath)
            console.log('File changed:', relativePath)
            io.of('/fs').to(projectId).emit('file-changed', {
              path: relativePath,
              projectId
            })
          })
          .on('unlink', (filePath) => {
            const relativePath = path.relative(projectDir, filePath)
            console.log('File deleted:', relativePath)
            io.of('/fs').to(projectId).emit('file-deleted', {
              path: relativePath,
              projectId
            })
          })
          .on('error', (error) => {
            console.error('Watcher error:', error)
          })

        fileWatchers.set(projectId, watcher)
      }

      // Join room for this project
      socket.join(projectId)
    })

    socket.on('unwatch-project', ({ projectId }) => {
      console.log('Unwatching project:', projectId)
      socket.leave(projectId)
    })

    socket.on('disconnect', () => {
      console.log('File system client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket server running`)
      console.log(`> Terminal namespace: /terminal`)
      console.log(`> Yjs namespace: /yjs`)
      console.log(`> File system namespace: /fs`)
    })
})
