'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, Plus, RefreshCw, FolderPlus } from 'lucide-react'
import type { TreeItem } from '@/lib/core/filesystem'

interface FileTreeProps {
  items: TreeItem[]
  activeFileId?: string
  onFileSelect: (item: TreeItem) => void
  onCreateFile: (parentPath: string) => void
  onCreateFolder: (parentPath: string) => void
  onRefresh: () => void
}

export function FileTree({ items, activeFileId, onFileSelect, onCreateFile, onCreateFolder, onRefresh }: FileTreeProps) {
  return (
    <div className="h-full flex flex-col bg-[#252526]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3e3e42]">
        <span className="text-sm text-gray-300 font-semibold">FILES</span>
        <div className="flex gap-1">
          <button
            onClick={() => onCreateFile('/')}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded"
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCreateFolder('/')}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No files yet
          </div>
        ) : (
          items.map(item => (
            <TreeNode
              key={item.id}
              item={item}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface TreeNodeProps {
  item: TreeItem
  activeFileId?: string
  onFileSelect: (item: TreeItem) => void
  level: number
}

function TreeNode({ item, activeFileId, onFileSelect, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const isActive = item.id === activeFileId
  const paddingLeft = level * 12 + 8

  if (item.type === 'file') {
    return (
      <div
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded text-sm ${
          isActive ? 'bg-[#37373d] text-white' : 'text-gray-300 hover:bg-[#2a2d2e]'
        }`}
        style={{ paddingLeft }}
        onClick={() => onFileSelect(item)}
      >
        <File className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 cursor-pointer rounded text-sm text-gray-300 hover:bg-[#2a2d2e]"
        style={{ paddingLeft }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        )}
        <Folder className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
      </div>

      {isExpanded && item.children.map(child => (
        <TreeNode
          key={child.id}
          item={child}
          activeFileId={activeFileId}
          onFileSelect={onFileSelect}
          level={level + 1}
        />
      ))}
    </div>
  )
}
