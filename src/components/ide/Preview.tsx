'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { webContainer } from '@/lib/core/webcontainer'

interface PreviewProps {
  onClose?: () => void
}

export function Preview({ onClose }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    let mounted = true
    let hasUrl = false

    const checkServer = async () => {
      if (hasUrl) {
        console.log('[Preview] Already has URL, skipping check')
        return
      }

      console.log('[Preview] Checking for server...')

      // Check for common dev server ports
      const allUrls = webContainer.getAllServerUrls()
      console.log('[Preview] All server URLs:', Array.from(allUrls.entries()))

      // Try to get URL for common ports (5173 is Vite default)
      let serverUrl = webContainer.getServerUrl(5173)
      if (!serverUrl) {
        serverUrl = webContainer.getServerUrl()
      }

      console.log('[Preview] Server URL from WebContainer:', serverUrl)

      if (serverUrl && mounted) {
        console.log('[Preview] ✅ Found server URL:', serverUrl)
        hasUrl = true
        setUrl(serverUrl)
        setIsLoading(false)
        return
      }

      if (allUrls.size > 0 && mounted) {
        const firstUrl = Array.from(allUrls.values())[0]
        console.log('[Preview] ✅ Using first available URL:', firstUrl)
        hasUrl = true
        setUrl(firstUrl)
        setIsLoading(false)
        return
      }

      console.log('[Preview] ❌ No server URL found yet')
      if (mounted) {
        setIsLoading(false)
      }
    }

    // Listen for server-ready events
    const setupServerListener = async () => {
      try {
        const container = await webContainer.getContainer()
        console.log('[Preview] WebContainer ready, listening for servers')

        container.on('server-ready', (port, serverUrl) => {
          console.log(`[Preview] Server detected on port ${port}: ${serverUrl}`)
          if (mounted && !hasUrl) {
            hasUrl = true
            setUrl(serverUrl)
            setIsLoading(false)
          }
        })
      } catch (err) {
        console.error('[Preview] Error setting up server listener:', err)
      }
    }

    setupServerListener()
    checkServer()

    // Poll every 2 seconds if no URL found
    const interval = setInterval(() => {
      if (!hasUrl && mounted) {
        console.log('[Preview] Polling for server...')
        checkServer()
      }
    }, 2000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Log the URL being displayed
    if (url) {
      console.log('[Preview] Rendering iframe with URL:', url)
    }
  }, [url])

  const handleRefresh = useCallback(() => {
    console.log('[Preview] Manual refresh triggered')
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Preview</span>
          {url && (
            <span className="text-xs text-gray-500">{url}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <button
                onClick={() => window.open(url, '_blank')}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleRefresh}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Waiting for dev server...</p>
              <p className="text-sm mt-2">Run: npm run dev</p>
            </div>
          </div>
        ) : url ? (
          <iframe
            key={refreshKey}
            src={url}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            allow="cross-origin-isolated; geolocation; microphone; camera; payment; usb"
            referrerPolicy="origin"
            loading="lazy"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>No dev server running</p>
              <p className="text-sm mt-2 text-gray-400">In terminal, run:</p>
              <code className="text-xs bg-gray-800 px-2 py-1 rounded mt-1 inline-block">npm run dev</code>
              <p className="text-xs mt-2 text-gray-500">Server will auto-detect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
