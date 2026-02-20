export type ProcessStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'error'
export type ProcessType = 'session' | 'cron' | 'sub-agent' | 'background' | 'system'

export interface ProcessData {
  id: string
  title: string
  status: ProcessStatus
  type: ProcessType
  startTime: Date
  endTime?: Date
  description: string
  progress: number // 0-100
  tokens: number
  tools: string[]
  error?: string
  sessionKey?: string
}

export interface ColumnConfig {
  status: ProcessStatus
  title: string
  color: string
  bgColor: string
  icon: string
}