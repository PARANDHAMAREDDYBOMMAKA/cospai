'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface FileSystemEvent {
  path: string
  projectId: string
}

interface UseFileSystemWatcherOptions {
  projectId: string
  onFileAdded?: (event: FileSystemEvent) => void
  onFileChanged?: (event: FileSystemEvent) => void
  onFileDeleted?: (event: FileSystemEvent) => void
}

export function useFileSystemWatcher({
  projectId,
  onFileAdded,
  onFileChanged,
  onFileDeleted,
}: UseFileSystemWatcherOptions) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!projectId) return

    // Connect to file system namespace
    const socket = io('/fs', {
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('File system watcher connected')
      socket.emit('watch-project', { projectId })
    })

    socket.on('disconnect', () => {
      console.log('File system watcher disconnected')
    })

    // Listen for file events
    if (onFileAdded) {
      socket.on('file-added', onFileAdded)
    }

    if (onFileChanged) {
      socket.on('file-changed', onFileChanged)
    }

    if (onFileDeleted) {
      socket.on('file-deleted', onFileDeleted)
    }

    // Cleanup
    return () => {
      socket.emit('unwatch-project', { projectId })
      socket.disconnect()
    }
  }, [projectId, onFileAdded, onFileChanged, onFileDeleted])

  return socketRef.current
}
