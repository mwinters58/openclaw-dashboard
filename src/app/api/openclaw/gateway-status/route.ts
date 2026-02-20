import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw gateway status --json')
    const status = JSON.parse(stdout)
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Failed to get gateway status:', error)
    return NextResponse.json(
      { error: 'Failed to get gateway status' }, 
      { status: 500 }
    )
  }
}