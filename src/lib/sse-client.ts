/**
 * Server-Sent Events Client for Real-Time OpenClaw Updates
 * Provides live streaming of process state changes via SSE
 */

import { ProcessData } from './types'

export interface SSEMessage {
  type: 'processes_update' | 'error' | 'ping'
  processes?: ProcessData[]
  error?: string
  timestamp: number
}

export class OpenClawSSEClient {
  private eventSource: EventSource | null = null
  private listeners: { [key: string]: Function[] } = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  constructor() {
    this.connect()
  }

  private connect() {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return
    }

    this.isConnecting = true
    const sseUrl = `/api/openclaw/stream`

    try {
      this.eventSource = new EventSource(sseUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers() {
    if (!this.eventSource) return

    this.eventSource.onopen = () => {
      console.log('SSE connected to OpenClaw stream')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connection_status', { status: 'connected' })
    }

    this.eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      this.isConnecting = false
      this.emit('connection_status', { status: 'disconnected' })
      
      // Only reconnect if we're not already trying
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.scheduleReconnect()
      }
    }
  }

  private handleMessage(message: SSEMessage) {
    switch (message.type) {
      case 'processes_update':
        if (message.processes) {
          this.emit('processes_update', message.processes)
        }
        break
      case 'error':
        this.emit('error', { error: message.error })
        break
      case 'ping':
        // Heartbeat received, connection is alive
        this.emit('heartbeat', { timestamp: message.timestamp })
        break
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max SSE reconnection attempts reached')
      this.emit('error', { error: 'Failed to maintain SSE connection' })
      return
    }

    setTimeout(() => {
      this.reconnectAttempts++
      console.log(`SSE reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      this.close()
      this.connect()
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
  }

  public on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  public off(event: string, callback?: Function) {
    if (!this.listeners[event]) return

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    } else {
      this.listeners[event] = []
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  public close() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  public isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }

  public getReadyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED
  }
}