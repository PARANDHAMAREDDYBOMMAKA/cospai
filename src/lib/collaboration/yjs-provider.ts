import * as Y from 'yjs'
import { io, Socket } from 'socket.io-client'
import { Awareness } from 'y-protocols/awareness'

export class WebSocketProvider {
  public doc: Y.Doc
  public awareness: Awareness
  private socket: Socket
  private room: string
  private synced = false

  constructor(projectId: string, fileId: string, doc: Y.Doc) {
    this.doc = doc
    this.room = `${projectId}:${fileId}`

    // Initialize awareness (for cursor positions, selections, etc.)
    this.awareness = new Awareness(doc)

    // Connect to WebSocket server
    this.socket = io('/yjs', {
      transports: ['websocket'],
    })

    this.setupEventHandlers()
    this.joinRoom(projectId, fileId)
  }

  private setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to Yjs server')
      this.syncDoc()
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Yjs server')
      this.synced = false
    })

    // Sync events
    this.socket.on('sync-step-1', ({ data }: { userId: string; data: Uint8Array }) => {
      Y.applyUpdate(this.doc, new Uint8Array(data))
    })

    this.socket.on('sync-step-2', ({ data }: { userId: string; data: Uint8Array }) => {
      Y.applyUpdate(this.doc, new Uint8Array(data))
      this.synced = true
    })

    this.socket.on('update', ({ data }: { userId: string; data: Uint8Array }) => {
      Y.applyUpdate(this.doc, new Uint8Array(data))
    })

    // User events
    this.socket.on('user-joined', ({ userId }: { userId: string; timestamp: number }) => {
      console.log('User joined:', userId)
    })

    this.socket.on('user-left', ({ userId }: { userId: string; timestamp: number }) => {
      console.log('User left:', userId)
    })

    this.socket.on('awareness', ({ userId, data }: { userId: string; data: any }) => {
      // Handle awareness updates from other users
      this.awareness.setLocalStateField('user', data)
    })

    // Document update handler
    this.doc.on('update', (update: Uint8Array) => {
      this.socket.emit('update', {
        projectId: this.room.split(':')[0],
        fileId: this.room.split(':')[1],
        data: Array.from(update),
      })
    })
  }

  private joinRoom(projectId: string, fileId: string) {
    this.socket.emit('join-room', { projectId, fileId })
  }

  private syncDoc() {
    // Send document state to server
    const stateVector = Y.encodeStateVector(this.doc)
    this.socket.emit('sync-step-1', {
      projectId: this.room.split(':')[0],
      fileId: this.room.split(':')[1],
      data: Array.from(stateVector),
    })
  }

  public setAwarenessState(state: any) {
    this.awareness.setLocalStateField('user', state)
    this.socket.emit('awareness', {
      projectId: this.room.split(':')[0],
      fileId: this.room.split(':')[1],
      data: state,
    })
  }

  public destroy() {
    this.socket.emit('leave-room', {
      projectId: this.room.split(':')[0],
      fileId: this.room.split(':')[1],
    })
    this.socket.disconnect()
  }
}
