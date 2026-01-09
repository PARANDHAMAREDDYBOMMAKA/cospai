'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { fileSystem } from '@/lib/core/filesystem'
import type { TreeItem, FileItem } from '@/lib/core/filesystem'

const Editor = dynamic(() => import('@/components/ide/Editor').then(m => ({ default: m.Editor })), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-gray-400">Loading editor...</div>
})

const Terminal = dynamic(() => import('@/components/ide/Terminal').then(m => ({ default: m.Terminal })), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-gray-400">Loading terminal...</div>
})

const FileTree = dynamic(() => import('@/components/ide/FileTree').then(m => ({ default: m.FileTree })), {
  ssr: false
})

const Preview = dynamic(() => import('@/components/ide/Preview').then(m => ({ default: m.Preview })), {
  ssr: false
})

const Resizer = dynamic(() => import('@/components/ide/Resizer').then(m => ({ default: m.Resizer })), {
  ssr: false
})

export default function IDEPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [files, setFiles] = useState<TreeItem[]>([])
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileParent, setNewFileParent] = useState('/')
  const [newFolderParent, setNewFolderParent] = useState('/')
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [editorHeight, setEditorHeight] = useState(67)

  useEffect(() => {
    loadFiles()
  }, [projectId])

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const tree = await fileSystem.loadProject(projectId)
      setFiles(tree)
    } catch (err) {
      console.error('Failed to load files:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const handleFileSelect = useCallback((item: TreeItem) => {
    if (item.type === 'file') {
      setActiveFile(item)
      setEditorValue(item.content)
    }
  }, [])

  const handleEditorChange = useCallback((value: string) => {
    setEditorValue(value)
    if (activeFile) {
      fileSystem.saveFile(projectId, activeFile.path, value)
    }
  }, [activeFile, projectId])

  const handleSave = useCallback(async () => {
    if (!activeFile) return

    try {
      setIsSaving(true)
      await fileSystem.saveFile(projectId, activeFile.path, editorValue)
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setIsSaving(false)
    }
  }, [activeFile, projectId, editorValue])

  const handleCreateFile = useCallback((parentPath: string) => {
    setNewFileParent(parentPath)
    setShowNewFileModal(true)
  }, [])

  const handleCreateFileSubmit = useCallback(async () => {
    if (!newFileName) {
      setError('File name is required')
      return
    }

    try {
      setError(null)
      const path = newFileParent === '/' ? `/${newFileName}` : `${newFileParent}/${newFileName}`
      await fileSystem.createFile(projectId, path)
      await loadFiles()
      setShowNewFileModal(false)
      setNewFileName('')
    } catch (err) {
      console.error('Failed to create file:', err)
      setError(err instanceof Error ? err.message : 'Failed to create file')
    }
  }, [newFileName, newFileParent, projectId, loadFiles])

  const handleCreateFolder = useCallback((parentPath: string) => {
    setNewFolderParent(parentPath)
    setShowNewFolderModal(true)
    setError(null)
  }, [])

  const handleCreateFolderSubmit = useCallback(async () => {
    if (!newFolderName) {
      setError('Folder name is required')
      return
    }

    try {
      setError(null)
      const path = newFolderParent === '/' ? `/${newFolderName}` : `${newFolderParent}/${newFolderName}`
      await fileSystem.createFolder(projectId, path)
      await loadFiles()
      setShowNewFolderModal(false)
      setNewFolderName('')
    } catch (err) {
      console.error('Failed to create folder:', err)
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    }
  }, [newFolderName, newFolderParent, projectId, loadFiles])

  const handleRefresh = useCallback(async () => {
    try {
      const tree = await fileSystem.syncFromWebContainer(projectId)
      setFiles(tree)
    } catch (err) {
      console.error('Failed to sync:', err)
    }
  }, [projectId])

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [handleRefresh])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        Loading IDE...
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      <div className="h-12 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-6 w-px bg-gray-700" />
          <h1 className="text-white font-semibold">CosPAI IDE</h1>
          {activeFile && (
            <span className="text-gray-400 text-sm">{activeFile.path}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              showPreview ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={handleSave}
            disabled={!activeFile || isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div style={{ width: `${sidebarWidth}px` }}>
          <FileTree
            items={files}
            activeFileId={activeFile?.id}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onRefresh={handleRefresh}
          />
        </div>

        <Resizer
          direction="horizontal"
          onResize={(delta) => {
            setSidebarWidth(prev => Math.max(150, Math.min(500, prev + delta)))
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div style={{ flex: editorHeight }} className="flex overflow-hidden min-h-[300px]">
            <div className={showPreview ? 'flex-1 h-full' : 'w-full h-full'}>
              {activeFile ? (
                <Editor
                  value={editorValue}
                  language={activeFile.language || 'plaintext'}
                  onChange={handleEditorChange}
                  onSave={handleSave}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  Select a file to start editing
                </div>
              )}
            </div>

            {showPreview && (
              <Resizer
                direction="horizontal"
                onResize={() => {}}
              />
            )}
            <div
              className="flex-1 h-full min-w-0"
              style={{ display: showPreview ? 'block' : 'none' }}
            >
              <Preview key={`preview-${projectId}`} />
            </div>
          </div>

          <Resizer
            direction="vertical"
            onResize={(delta) => {
              const windowHeight = window.innerHeight - 48
              const deltaPercent = (delta / windowHeight) * 100
              setEditorHeight(prev => Math.max(40, Math.min(80, prev + deltaPercent)))
            }}
          />

          <div style={{ flex: 100 - editorHeight }} className="bg-[#1e1e1e] min-h-[200px] relative">
            <Terminal key={`terminal-${projectId}`} />
          </div>
        </div>
      </div>

      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-4 w-96">
            <h3 className="text-white font-semibold mb-3">New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFileSubmit()
                if (e.key === 'Escape') {
                  setShowNewFileModal(false)
                  setError(null)
                }
              }}
              placeholder="filename.js"
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3e3e42] rounded text-white text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">{error}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewFileModal(false)
                  setError(null)
                }}
                className="px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3c3c3c] rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFileSubmit}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-4 w-96">
            <h3 className="text-white font-semibold mb-3">New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolderSubmit()
                if (e.key === 'Escape') {
                  setShowNewFolderModal(false)
                  setError(null)
                }
              }}
              placeholder="folder-name"
              className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3e3e42] rounded text-white text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs mt-2">{error}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewFolderModal(false)
                  setError(null)
                }}
                className="px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3c3c3c] rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolderSubmit}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
