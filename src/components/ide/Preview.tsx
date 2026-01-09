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
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    console.log('[Preview] Effect running, setting up preview...')

    const setupPreview = async () => {
      try {
        // Ensure WebContainer is booted
        await webContainer.getContainer()
        console.log('[Preview] WebContainer ready')

        // Unsubscribe from previous listener if exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }

        // Subscribe to server-ready events (this will immediately notify about existing servers)
        unsubscribeRef.current = webContainer.onServerReady((port, serverUrl) => {
          console.log(`[Preview] 🚀 Server detected on port ${port}: ${serverUrl}`)
          console.log(`[Preview] Setting URL state to: ${serverUrl}`)
          setUrl(serverUrl)
          setIsLoading(false)
        })

        // Also check current URLs as fallback
        const allUrls = webContainer.getAllServerUrls()
        console.log('[Preview] Current server URLs:', Array.from(allUrls.entries()))

        if (allUrls.size > 0) {
          // Prefer port 5173 (Vite), then 3000 (common dev port), then any
          let serverUrl = webContainer.getServerUrl(5173)
          if (!serverUrl) serverUrl = webContainer.getServerUrl(3000)
          if (!serverUrl) serverUrl = Array.from(allUrls.values())[0]

          if (serverUrl) {
            console.log('[Preview] ✅ Using server URL:', serverUrl)
            setUrl(serverUrl)
            setIsLoading(false)
          }
        } else {
          console.log('[Preview] ⏳ No server found yet, waiting...')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[Preview] Error setting up preview:', err)
        setIsLoading(false)
      }
    }

    setupPreview()

    return () => {
      console.log('[Preview] Cleanup - unsubscribing')
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Log the URL being displayed
    console.log('[Preview] URL state changed to:', url)
    console.log('[Preview] isLoading state:', isLoading)
  }, [url, isLoading])

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
