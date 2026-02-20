'use client'

import { useState, useEffect } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import Header from '../components/Header'
import { ProcessData, ProcessStatus } from '../lib/types'

export default function Dashboard() {
  const [processes, setProcesses] = useState<ProcessData[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Mock data for now - will connect to real OpenClaw APIs later
  const mockProcesses: ProcessData[] = [
    {
      id: 'main-session',
      title: 'Main Session',
      status: 'idle' as ProcessStatus,
      type: 'session',
      startTime: new Date(),
      description: 'Waiting for user input',
      progress: 0,
      tokens: 1250,
      tools: ['web_search', 'exec', 'read']
    },
    {
      id: 'email-processing',
      title: 'Email Processing',
      status: 'running' as ProcessStatus,
      type: 'cron',
      startTime: new Date(Date.now() - 30000),
      description: 'Processing forwarded emails...',
      progress: 65,
      tokens: 2840,
      tools: ['gmail', 'todoist']
    },
    {
      id: 'mbt-sync',
      title: 'MBT Meal Sync',
      status: 'completed' as ProcessStatus,
      type: 'background',
      startTime: new Date(Date.now() - 120000),
      description: '✅ 3 meals synced successfully',
      progress: 100,
      tokens: 450,
      tools: ['mbt_logger']
    },
    {
      id: 'banff-research',
      title: 'Banff Trip Research',
      status: 'completed' as ProcessStatus,
      type: 'sub-agent',
      startTime: new Date(Date.now() - 3600000),
      description: '✅ Complete travel research generated',
      progress: 100,
      tokens: 8920,
      tools: ['web_search', 'write', 'exec']
    },
    {
      id: 'google-auth',
      title: 'Google API Auth',
      status: 'error' as ProcessStatus,
      type: 'system',
      startTime: new Date(Date.now() - 86400000),
      description: '❌ Authentication expired',
      progress: 0,
      tokens: 0,
      tools: []
    }
  ]

  useEffect(() => {
    // TODO: Replace with real OpenClaw API calls
    setProcesses(mockProcesses)
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // Here we'd fetch real-time data from OpenClaw APIs
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <Header lastUpdate={lastUpdate} processCount={processes.length} />
      <KanbanBoard processes={processes} />
    </div>
  )
}