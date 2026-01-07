'use client'

const DB_NAME = 'cospai_ide'
const DB_VERSION = 1
const FILES_STORE = 'files'

export interface StoredFile {
  id: string
  projectId: string
  path: string
  content: string
  timestamp: number
}

export class StorageService {
  private static instance: StorageService
  private db: IDBDatabase | null = null

  private constructor() {}

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService()
    }
    return this.instance
  }

  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const store = db.createObjectStore(FILES_STORE, { keyPath: 'id' })
          store.createIndex('projectId', 'projectId', { unique: false })
          store.createIndex('path', 'path', { unique: false })
        }
      }
    })
  }

  async saveFile(file: StoredFile): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FILES_STORE], 'readwrite')
      const store = transaction.objectStore(FILES_STORE)
      const request = store.put(file)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFile(id: string): Promise<StoredFile | null> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FILES_STORE], 'readonly')
      const store = transaction.objectStore(FILES_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjectFiles(projectId: string): Promise<StoredFile[]> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FILES_STORE], 'readonly')
      const store = transaction.objectStore(FILES_STORE)
      const index = store.index('projectId')
      const request = index.getAll(projectId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFile(id: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([FILES_STORE], 'readwrite')
      const store = transaction.objectStore(FILES_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearProject(projectId: string): Promise<void> {
    const files = await this.getProjectFiles(projectId)
    await Promise.all(files.map(f => this.deleteFile(f.id)))
  }
}

export const storage = StorageService.getInstance()
