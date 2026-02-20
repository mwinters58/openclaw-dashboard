/**
 * OpenClaw API Integration
 * Connects to real OpenClaw Gateway for live process data
 */

import { ProcessData, ProcessStatus, ProcessType } from './types'

export interface OpenClawSession {
  key: string
  kind: 'direct' | 'isolated' 
  updatedAt: number
  ageMs: number
  sessionId: string
  systemSent?: boolean
  abortedLastRun?: boolean
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  model?: string
  contextTokens?: number
}

export interface OpenClawCronJob {
  id: string
  agentId: string
  name: string
  enabled: boolean
  createdAtMs: number
  updatedAtMs: number
  schedule: {
    kind: string
    expr: string
    tz: string
  }
  sessionTarget: string
  payload: {
    kind: string
    message: string
    timeoutSeconds?: number
  }
  state: {
    nextRunAtMs?: number
    lastRunAtMs?: number
    lastStatus?: string
    lastDurationMs?: number
    consecutiveErrors?: number
  }
}

export interface OpenClawGatewayStatus {
  service: {
    runtime: {
      status: string
      state: string
      pid: number
    }
  }
  rpc: {
    ok: boolean
    url: string
  }
}

class OpenClawAPI {
  private gatewayUrl: string = ''
  private isConnected: boolean = false

  constructor() {
    // Initialize with default OpenClaw Gateway URL
    this.gatewayUrl = 'http://127.0.0.1:18789'
  }

  /**
   * Check OpenClaw Gateway status
   */
  async getGatewayStatus(): Promise<OpenClawGatewayStatus | null> {
    try {
      const response = await fetch('/api/openclaw/gateway-status')
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to get gateway status:', error)
      return null
    }
  }

  /**
   * Get all sessions from OpenClaw
   */
  async getSessions(): Promise<OpenClawSession[]> {
    try {
      const response = await fetch('/api/openclaw/sessions')
      if (!response.ok) return []
      const data = await response.json()
      return data.sessions || []
    } catch (error) {
      console.error('Failed to get sessions:', error)
      return []
    }
  }

  /**
   * Get all cron jobs from OpenClaw
   */
  async getCronJobs(): Promise<OpenClawCronJob[]> {
    try {
      const response = await fetch('/api/openclaw/cron-jobs')
      if (!response.ok) return []
      const data = await response.json()
      return data.jobs || []
    } catch (error) {
      console.error('Failed to get cron jobs:', error)
      return []
    }
  }

  /**
   * Convert OpenClaw data to ProcessData format
   */
  convertToProcessData(sessions: OpenClawSession[], cronJobs: OpenClawCronJob[]): ProcessData[] {
    const processes: ProcessData[] = []

    // Convert sessions to processes
    sessions.forEach(session => {
      const sessionType = this.getSessionType(session.key)
      const status = this.getSessionStatus(session)
      const progress = this.getSessionProgress(session)

      processes.push({
        id: session.sessionId,
        title: this.getSessionTitle(session.key),
        status,
        type: sessionType,
        startTime: new Date(session.updatedAt - session.ageMs),
        endTime: status === 'completed' ? new Date(session.updatedAt) : undefined,
        description: this.getSessionDescription(session, status),
        progress,
        tokens: session.totalTokens || 0,
        tools: this.getSessionTools(session.key),
        error: session.abortedLastRun ? 'Session was aborted' : undefined,
        sessionKey: session.key
      })
    })

    // Convert cron jobs to processes
    cronJobs.forEach(cronJob => {
      const status = this.getCronStatus(cronJob)
      const progress = status === 'completed' ? 100 : status === 'running' ? 50 : 0

      processes.push({
        id: cronJob.id,
        title: cronJob.name,
        status,
        type: 'cron',
        startTime: new Date(cronJob.createdAtMs),
        endTime: cronJob.state.lastRunAtMs ? new Date(cronJob.state.lastRunAtMs) : undefined,
        description: this.getCronDescription(cronJob, status),
        progress,
        tokens: 0, // Cron jobs don't have token data directly
        tools: ['cron', 'message'],
        error: cronJob.state.consecutiveErrors && cronJob.state.consecutiveErrors > 0 ? 
               `${cronJob.state.consecutiveErrors} consecutive errors` : undefined
      })
    })

    return processes
  }

  private getSessionType(sessionKey: string): ProcessType {
    if (sessionKey.includes(':main')) return 'session'
    if (sessionKey.includes(':subagent:')) return 'sub-agent'
    if (sessionKey.includes(':cron:')) return 'background'
    return 'system'
  }

  private getSessionStatus(session: OpenClawSession): ProcessStatus {
    const ageMinutes = session.ageMs / (1000 * 60)
    
    if (session.abortedLastRun) return 'error'
    if (ageMinutes < 5 && session.systemSent) return 'running'
    if (ageMinutes < 30) return 'waiting'
    if (session.totalTokens && session.totalTokens > 0) return 'completed'
    return 'idle'
  }

  private getSessionProgress(session: OpenClawSession): number {
    const ageMinutes = session.ageMs / (1000 * 60)
    
    if (session.abortedLastRun) return 0
    if (ageMinutes < 5 && session.systemSent) return 75
    if (ageMinutes < 30) return 25
    if (session.totalTokens && session.totalTokens > 0) return 100
    return 0
  }

  private getSessionTitle(sessionKey: string): string {
    const parts = sessionKey.split(':')
    
    if (parts[2] === 'main') return 'Main Session'
    if (parts[2] === 'subagent') return `Sub-Agent ${parts[3]?.substring(0, 8) || ''}`
    if (parts[2] === 'cron') return `Cron Job ${parts[3]?.substring(0, 8) || ''}`
    
    return sessionKey
  }

  private getSessionDescription(session: OpenClawSession, status: ProcessStatus): string {
    const ageMinutes = Math.floor(session.ageMs / (1000 * 60))
    
    if (status === 'error') return '❌ Session aborted'
    if (status === 'running') return '⚡ Processing request...'
    if (status === 'waiting') return `⏳ Waiting for input (${ageMinutes}m ago)`
    if (status === 'completed') return '✅ Session completed'
    return '😴 Idle, ready for input'
  }

  private getSessionTools(sessionKey: string): string[] {
    if (sessionKey.includes(':main')) return ['web_search', 'exec', 'read', 'write']
    if (sessionKey.includes(':subagent:')) return ['web_search', 'exec', 'browser']
    if (sessionKey.includes(':cron:')) return ['message', 'exec', 'mbt_logger']
    return ['system']
  }

  private getCronStatus(cronJob: OpenClawCronJob): ProcessStatus {
    if (!cronJob.enabled) return 'error'
    
    const now = Date.now()
    const nextRun = cronJob.state.nextRunAtMs
    const lastRun = cronJob.state.lastRunAtMs
    
    // If it's running recently (within 5 minutes)
    if (lastRun && (now - lastRun) < 300000 && cronJob.state.lastStatus === 'ok') {
      return 'running'
    }
    
    // If it has consecutive errors
    if (cronJob.state.consecutiveErrors && cronJob.state.consecutiveErrors > 0) {
      return 'error'
    }
    
    // If it ran successfully recently
    if (lastRun && cronJob.state.lastStatus === 'ok') {
      return 'completed'
    }
    
    // If it's scheduled to run soon (within an hour)
    if (nextRun && (nextRun - now) < 3600000) {
      return 'waiting'
    }
    
    return 'idle'
  }

  private getCronDescription(cronJob: OpenClawCronJob, status: ProcessStatus): string {
    const nextRun = cronJob.state.nextRunAtMs
    const lastRun = cronJob.state.lastRunAtMs
    
    if (status === 'error') {
      return `❌ ${cronJob.state.consecutiveErrors} consecutive errors`
    }
    
    if (status === 'running') {
      return '⚡ Job executing...'
    }
    
    if (status === 'completed' && lastRun) {
      const lastRunMinutes = Math.floor((Date.now() - lastRun) / (1000 * 60))
      return `✅ Last run ${lastRunMinutes}m ago`
    }
    
    if (status === 'waiting' && nextRun) {
      const nextRunMinutes = Math.floor((nextRun - Date.now()) / (1000 * 60))
      return `⏳ Next run in ${nextRunMinutes}m`
    }
    
    return `😴 Scheduled: ${cronJob.schedule.expr}`
  }
}

export const openclawAPI = new OpenClawAPI()