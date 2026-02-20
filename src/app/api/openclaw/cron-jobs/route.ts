import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw cron list --json')
    const cronData = JSON.parse(stdout)
    
    return NextResponse.json(cronData)
  } catch (error) {
    console.error('Failed to get cron jobs:', error)
    return NextResponse.json(
      { error: 'Failed to get cron jobs' }, 
      { status: 500 }
    )
  }
}