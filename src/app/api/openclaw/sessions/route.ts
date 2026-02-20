import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw sessions --json')
    const sessionsData = JSON.parse(stdout)
    
    return NextResponse.json(sessionsData)
  } catch (error) {
    console.error('Failed to get sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' }, 
      { status: 500 }
    )
  }
}