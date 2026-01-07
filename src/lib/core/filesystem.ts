'use client'

import { webContainer } from './webcontainer'
import { storage, type StoredFile } from './storage'

export interface FileItem {
  id: string
  name: string
  path: string
  content: string
  type: 'file'
  language?: string
}

export interface FolderItem {
  id: string
  name: string
  path: string
  type: 'folder'
  children: (FileItem | FolderItem)[]
}

export type TreeItem = FileItem | FolderItem

export class FileSystemService {
  private static instance: FileSystemService

  private constructor() {}

  static getInstance(): FileSystemService {
    if (!this.instance) {
      this.instance = new FileSystemService()
    }
    return this.instance
  }

  async loadProject(projectId: string): Promise<TreeItem[]> {
    const files = await storage.getProjectFiles(projectId)

    if (files.length > 0) {
      await this.mountToWebContainer(files)
    }

    return this.buildTree(files)
  }

  async saveFile(projectId: string, path: string, content: string): Promise<void> {
    const container = await webContainer.getContainer()
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    await this.ensureDirectory(cleanPath)
    await container.fs.writeFile(cleanPath, content)

    const storedFile: StoredFile = {
      id: `${projectId}:${path}`,
      projectId,
      path,
      content,
      timestamp: Date.now()
    }

    await storage.saveFile(storedFile)
  }

  async readFile(path: string): Promise<string> {
    const container = await webContainer.getContainer()
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return await container.fs.readFile(cleanPath, 'utf-8')
  }

  async deleteFile(projectId: string, path: string): Promise<void> {
    const container = await webContainer.getContainer()
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    await container.fs.rm(cleanPath, { force: true })
    await storage.deleteFile(`${projectId}:${path}`)
  }

  async createFile(projectId: string, path: string, content: string = ''): Promise<void> {
    await this.saveFile(projectId, path, content)
  }

  async createFolder(projectId: string, path: string): Promise<void> {
    const container = await webContainer.getContainer()
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    await container.fs.mkdir(cleanPath, { recursive: true })
  }

  async syncFromWebContainer(projectId: string): Promise<TreeItem[]> {
    const container = await webContainer.getContainer()
    const files: StoredFile[] = []

    const scan = async (dir: string = '') => {
      const items = await container.fs.readdir(dir || '.', { withFileTypes: true })

      for (const item of items) {
        if (this.shouldIgnore(item.name)) continue

        const itemPath = dir ? `${dir}/${item.name}` : item.name
        const fullPath = `/${itemPath}`

        if (item.isDirectory()) {
          await scan(itemPath)
        } else if (item.isFile()) {
          try {
            const content = await container.fs.readFile(itemPath, 'utf-8')
            files.push({
              id: `${projectId}:${fullPath}`,
              projectId,
              path: fullPath,
              content,
              timestamp: Date.now()
            })
          } catch (err) {
            console.warn(`Could not read file: ${itemPath}`)
          }
        }
      }
    }

    await scan()

    for (const file of files) {
      await storage.saveFile(file)
    }

    return this.buildTree(files)
  }

  private async mountToWebContainer(files: StoredFile[]): Promise<void> {
    const container = await webContainer.getContainer()
    const tree: any = {}

    for (const file of files) {
      const parts = file.path.split('/').filter(Boolean)
      let current = tree

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = { directory: {} }
        }
        current = current[part].directory
      }

      const fileName = parts[parts.length - 1]
      current[fileName] = {
        file: { contents: file.content }
      }
    }

    await container.mount(tree)
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    const parts = filePath.split('/').filter(Boolean)
    if (parts.length <= 1) return

    const container = await webContainer.getContainer()
    let currentPath = ''

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += (currentPath ? '/' : '') + parts[i]
      try {
        await container.fs.mkdir(currentPath, { recursive: true })
      } catch (err) {
      }
    }
  }

  private buildTree(files: StoredFile[]): TreeItem[] {
    const tree: TreeItem[] = []
    const folderMap = new Map<string, FolderItem>()

    const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

    for (const file of sorted) {
      const parts = file.path.split('/').filter(Boolean)

      if (parts.length === 1) {
        tree.push({
          id: file.id,
          name: parts[0],
          path: file.path,
          content: file.content,
          type: 'file',
          language: this.detectLanguage(parts[0])
        })
      } else {
        let currentPath = ''
        let currentLevel = tree

        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += '/' + parts[i]

          let folder = folderMap.get(currentPath)

          if (!folder) {
            folder = {
              id: `folder:${currentPath}`,
              name: parts[i],
              path: currentPath,
              type: 'folder',
              children: []
            }
            folderMap.set(currentPath, folder)
            currentLevel.push(folder)
          }

          currentLevel = folder.children
        }

        currentLevel.push({
          id: file.id,
          name: parts[parts.length - 1],
          path: file.path,
          content: file.content,
          type: 'file',
          language: this.detectLanguage(parts[parts.length - 1])
        })
      }
    }

    return tree
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'md': 'markdown'
    }
    return map[ext || ''] || 'plaintext'
  }

  private shouldIgnore(name: string): boolean {
    const ignore = ['.git', '.next', 'dist', 'build']
    return ignore.includes(name) || name.startsWith('.')
  }
}

export const fileSystem = FileSystemService.getInstance()
