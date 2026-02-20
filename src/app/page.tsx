'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import Header from '../components/Header'
import { ProcessData } from '../lib/types'
import { openclawAPI } from '../lib/openclaw-api'
import { OpenClawSSEClient } from '../lib/sse-client'

export default function Dashboard() {
  const [processes, setProcesses] = useState<ProcessData[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const sseClientRef = useRef<OpenClawSSEClient | null>(null)

  const fetchProcesses = useCallback(async () => {
    try {
      setError(null)
      
      // Check gateway status first
      const gatewayStatus = await openclawAPI.getGatewayStatus()
      if (!gatewayStatus?.rpc?.ok) {
        setConnectionStatus('disconnected')
        setError('OpenClaw Gateway is not running')
        return
      }
      
      setConnectionStatus('connected')
      
      // Get real OpenClaw data
      const [sessions, cronJobs] = await Promise.all([
        openclawAPI.getSessions(),
        openclawAPI.getCronJobs()
      ])
      
      // Convert to ProcessData format
      const processData = openclawAPI.convertToProcessData(sessions, cronJobs)
      
      setProcesses(processData)
      setLastUpdate(new Date())
      setIsLoading(false)
      
    } catch (error) {
      console.error('Failed to fetch processes:', error)
      setError('Failed to fetch process data')
      setConnectionStatus('disconnected')
      setIsLoading(false)
    }
  }, [])

  // Initialize SSE streaming
  useEffect(() => {
    if (!streamingEnabled) {
      // Fall back to polling
      fetchProcesses()
      const interval = setInterval(fetchProcesses, 3000)
      return () => clearInterval(interval)
    }

    // Use Server-Sent Events for real-time streaming
    const sseClient = new OpenClawSSEClient()
    sseClientRef.current = sseClient

    // Handle process updates
    sseClient.on('processes_update', (processData: ProcessData[]) => {
      setProcesses(processData)
      setLastUpdate(new Date())
      setIsLoading(false)
      setError(null)
    })

    // Handle connection status
    sseClient.on('connection_status', (status: { status: string }) => {
      setConnectionStatus(status.status as 'connected' | 'disconnected' | 'connecting')
    })

    // Handle errors
    sseClient.on('error', (errorData: { error: string }) => {
      setError(errorData.error)
      setConnectionStatus('disconnected')
    })

    // Handle heartbeat
    sseClient.on('heartbeat', () => {
      // Connection is alive, no action needed
    })

    return () => {
      sseClient.close()
    }
  }, [streamingEnabled, fetchProcesses])

  const toggleStreaming = useCallback(() => {
    setStreamingEnabled(!streamingEnabled)
    if (sseClientRef.current) {
      sseClientRef.current.close()
      sseClientRef.current = null
    }
  }, [streamingEnabled])

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <Header 
        lastUpdate={lastUpdate} 
        processCount={processes.length}
        connectionStatus={connectionStatus}
        error={error}
        isLoading={isLoading}
        streamingEnabled={streamingEnabled}
        onToggleStreaming={toggleStreaming}
      />
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <span className="font-semibold">Connection Error</span>
          </div>
          <p className="text-red-200 text-sm mt-1">{error}</p>
          <p className="text-red-200 text-xs mt-2">
            Make sure OpenClaw Gateway is running: <code className="bg-black/20 px-1 rounded">openclaw gateway start</code>
          </p>
          {!streamingEnabled && (
            <button 
              onClick={toggleStreaming}
              className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Enable Live Streaming
            </button>
          )}
        </div>
      )}
      
      {/* Streaming Info Banner */}
      {streamingEnabled && connectionStatus === 'connected' && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 mb-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400">📡</span>
              <span className="text-sm font-medium">Live Streaming Active</span>
            </div>
            <div className="text-xs text-green-200">
              Real-time updates • No refresh needed
            </div>
          </div>
        </div>
      )}
      
      <KanbanBoard processes={processes} />
    </div>
  )
}