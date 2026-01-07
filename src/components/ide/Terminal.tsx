'use client'

import { useEffect, useRef, memo, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { webContainer } from '@/lib/core/webcontainer'

interface TerminalProps {
  onReady?: () => void
}

export const Terminal = memo(function Terminal({ onReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const isMountedRef = useRef(true)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!terminalRef.current) return

    isMountedRef.current = true
    console.log('[Terminal] Initializing...')

    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    if (!terminalRef.current) {
      console.error('[Terminal] terminalRef is null when trying to open terminal')
      return
    }

    terminal.open(terminalRef.current)
    console.log('[Terminal] Terminal opened in DOM element')

    xtermRef.current = terminal
    fitAddonRef.current = fitAddon

    // Verify terminal element was created and check dimensions
    setTimeout(() => {
      if (!isMountedRef.current) return
      const xtermElement = terminalRef.current?.querySelector('.xterm')
      if (xtermElement) {
        const rect = xtermElement.getBoundingClientRect()
        const computed = window.getComputedStyle(xtermElement)
        console.log('[Terminal] XTerm element:', {
          dimensions: `${rect.width}x${rect.height}`,
          visibility: computed.visibility,
          display: computed.display,
          opacity: computed.opacity,
          zIndex: computed.zIndex
        })
      } else {
        console.error('[Terminal] XTerm DOM element NOT found!')
      }
    }, 200)

    // Fit after container has rendered and has actual dimensions
    const fitTerminal = () => {
      if (!terminalRef.current) return

      const rect = terminalRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        console.log('[Terminal] Container not ready (0x0), retrying...')
        setTimeout(fitTerminal, 50)
        return
      }

      try {
        fitAddon.fit()
        console.log('[Terminal] Fitted to container:', terminal.cols, 'x', terminal.rows, `(${Math.floor(rect.width)}x${Math.floor(rect.height)}px)`)
      } catch (err) {
        console.error('[Terminal] Error fitting:', err)
      }
    }

    setTimeout(fitTerminal, 0)

    const initTerminal = async () => {
      try {
        console.log('[Terminal] Getting WebContainer...')
        const container = await webContainer.getContainer()
        console.log('[Terminal] WebContainer ready')

        console.log('[Terminal] Spawning shell...')
        const shell = await container.spawn('jsh', {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows
          }
        })
        console.log('[Terminal] Shell spawned')

        const input = shell.input.getWriter()

        // Check for shell exit
        shell.exit.then((code) => {
          console.log('[Terminal] Shell exited with code:', code)
          terminal.writeln(`\r\n\x1b[33mShell exited with code ${code}\x1b[0m`)
        }).catch(err => {
          console.error('[Terminal] Exit handler error:', err)
        })

        let outputReceived = false
        shell.output.pipeTo(
          new WritableStream({
            write(data) {
              if (!outputReceived) {
                outputReceived = true
                console.log('[Terminal] First output from shell:', data)
              }
              terminal.write(data)
            }
          })
        ).catch(err => {
          console.error('[Terminal] Output pipe error:', err)
        })

        terminal.onData((data) => {
          console.log('[Terminal] User input:', data.replace(/\r/g, '\\r').replace(/\n/g, '\\n'))
          input.write(data).catch(err => {
            console.error('[Terminal] Input write error:', err)
          })
        })

        let resizeTimeout: NodeJS.Timeout | null = null
        const handleResize = () => {
          if (resizeTimeout) clearTimeout(resizeTimeout)
          resizeTimeout = setTimeout(() => {
            try {
              fitAddon.fit()
              shell.resize({
                cols: terminal.cols,
                rows: terminal.rows
              })
              console.log('[Terminal] Resized to:', terminal.cols, 'x', terminal.rows)
            } catch (err) {
              console.error('[Terminal] Resize error:', err)
            }
          }, 50)
        }

        // Watch for container size changes
        const resizeObserver = new ResizeObserver(() => {
          handleResize()
        })

        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current)
        }

        window.addEventListener('resize', handleResize)

        // Display welcome message
        setTimeout(() => {
          try {
            terminal.writeln('\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m')
            terminal.writeln('\x1b[1;36m║   WebContainer Terminal Ready ✓      ║\x1b[0m')
            terminal.writeln('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m')
            terminal.writeln('')
            console.log('[Terminal] Welcome message displayed')
          } catch (err) {
            console.error('[Terminal] Error displaying welcome:', err)
          }
        }, 200)

        setStatus('ready')
        onReady?.()

        // Capture shell and input in closure to prevent cleanup from previous render killing new shell
        const currentShell = shell
        const currentInput = input

        return () => {
          console.log('[Terminal] Cleanup for shell')
          window.removeEventListener('resize', handleResize)
          resizeObserver.disconnect()
          try {
            currentShell.kill()
            console.log('[Terminal] Shell killed in cleanup')
          } catch (err) {
            console.error('[Terminal] Error killing shell:', err)
          }
          try {
            currentInput.releaseLock()
          } catch (err) {
            // Input might already be released
          }
        }
      } catch (err) {
        console.error('[Terminal] Error:', err)
        terminal.writeln(`\r\n\x1b[31mError: ${err}\x1b[0m`)
        setStatus('error')
      }
    }

    let cleanupFn: (() => void) | null = null
    initTerminal().then(fn => {
      cleanupFn = fn || null
    })

    return () => {
      console.log('[Terminal] useEffect cleanup, isMounted:', isMountedRef.current)
      isMountedRef.current = false
      if (cleanupFn) {
        console.log('[Terminal] Running shell cleanup')
        cleanupFn()
      }
      // Only dispose if not in React Strict Mode double-mount
      setTimeout(() => {
        if (!isMountedRef.current) {
          console.log('[Terminal] Disposing terminal after confirmation - still unmounted')
          terminal.dispose()
        } else {
          console.log('[Terminal] Skipping dispose - component remounted')
        }
      }, 150)
    }
  }, [onReady])

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            status === 'ready' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-300">Terminal</span>
          {status === 'loading' && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 bg-[#1e1e1e] w-full"
      />
    </div>
  )
})
