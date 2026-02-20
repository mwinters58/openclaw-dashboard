import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'
import { openclawAPI } from '@/lib/openclaw-api'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Get both sessions and cron jobs in parallel
    const [sessionsResult, cronResult] = await Promise.allSettled([
      execAsync('openclaw sessions --json'),
      execAsync('openclaw cron list --json')
    ])

    const sessions = sessionsResult.status === 'fulfilled' 
      ? JSON.parse(sessionsResult.value.stdout).sessions || []
      : []

    const cronJobs = cronResult.status === 'fulfilled'
      ? JSON.parse(cronResult.value.stdout).jobs || []
      : []

    // Convert to ProcessData format
    const processes = openclawAPI.convertToProcessData(sessions, cronJobs)

    return NextResponse.json({ processes })
  } catch (error) {
    console.error('Failed to get processes:', error)
    return NextResponse.json(
      { error: 'Failed to get processes' }, 
      { status: 500 }
    )
  }
}