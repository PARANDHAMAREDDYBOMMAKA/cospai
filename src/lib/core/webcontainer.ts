'use client'

import { WebContainer } from '@webcontainer/api'

export class WebContainerService {
  private static instance: WebContainerService
  private container: WebContainer | null = null
  private bootPromise: Promise<WebContainer> | null = null
  private serverUrls: Map<number, string> = new Map()
  private serverReadyCallbacks: Array<(port: number, url: string) => void> = []

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!this.instance) {
      this.instance = new WebContainerService()
    }
    return this.instance
  }

  async boot(): Promise<WebContainer> {
    if (this.container) {
      return this.container
    }

    if (this.bootPromise) {
      return this.bootPromise
    }

    this.bootPromise = WebContainer.boot()
    this.container = await this.bootPromise

    this.container.on('server-ready', (port, url) => {
      console.log(`[WebContainer] 🚀 Server ready on port ${port}: ${url}`)
      this.serverUrls.set(port, url)

      // Notify all registered callbacks
      this.serverReadyCallbacks.forEach(callback => {
        try {
          callback(port, url)
        } catch (err) {
          console.error('[WebContainer] Error in server-ready callback:', err)
        }
      })
    })

    console.log('[WebContainer] Boot complete, container ready')
    return this.container
  }

  onServerReady(callback: (port: number, url: string) => void): () => void {
    this.serverReadyCallbacks.push(callback)

    // Immediately notify about existing servers
    this.serverUrls.forEach((url, port) => {
      callback(port, url)
    })

    // Return unsubscribe function
    return () => {
      const index = this.serverReadyCallbacks.indexOf(callback)
      if (index > -1) {
        this.serverReadyCallbacks.splice(index, 1)
      }
    }
  }

  async getContainer(): Promise<WebContainer> {
    return this.boot()
  }

  getServerUrl(port?: number): string | null {
    if (port) {
      return this.serverUrls.get(port) || null
    }
    const urls = Array.from(this.serverUrls.values())
    return urls.length > 0 ? urls[0] : null
  }

  getAllServerUrls(): Map<number, string> {
    return this.serverUrls
  }

  isReady(): boolean {
    return this.container !== null
  }
}

export const webContainer = WebContainerService.getInstance()
