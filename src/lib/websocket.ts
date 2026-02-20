/**
 * WebSocket Client for Real-Time OpenClaw Updates
 * Provides live streaming of process state changes
 */

import { ProcessData } from './types'

export interface WebSocketMessage {
  type: 'processes_update' | 'connection_status' | 'error' | 'ping'
  data?: any
  timestamp: number
}

export class OpenClawWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: { [key: string]: Function[] } = {}
  private isConnecting = false

  constructor() {
    this.connect()
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/openclaw/websocket`

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.isConnecting = false
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected to OpenClaw')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connection_status', { status: 'connected' })
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason)
      this.isConnecting = false
      this.emit('connection_status', { status: 'disconnected' })
      
      if (!event.wasClean) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnecting = false
      this.emit('error', { error: 'WebSocket connection error' })
    }
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'processes_update':
        this.emit('processes_update', message.data)
        break
      case 'connection_status':
        this.emit('connection_status', message.data)
        break
      case 'error':
        this.emit('error', message.data)
        break
      case 'ping':
        this.pong()
        break
    }
  }

  private pong() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }))
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached')
      this.emit('error', { error: 'Failed to maintain WebSocket connection' })
      return
    }

    setTimeout(() => {
      this.reconnectAttempts++
      console.log(`WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
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

  public send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected, message not sent:', message)
    }
  }

  public close() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  public getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}