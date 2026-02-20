import { exec } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'
import { openclawAPI } from '@/lib/openclaw-api'

const execAsync = promisify(exec)

export async function GET() {
  const encoder = new TextEncoder()

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      let intervalId: NodeJS.Timeout

      const sendUpdate = async () => {
        try {
          // Get fresh data from OpenClaw
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

          // Send as SSE event
          const data = JSON.stringify({
            type: 'processes_update',
            processes,
            timestamp: Date.now()
          })

          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (error) {
          console.error('Failed to fetch OpenClaw data:', error)
          
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to fetch OpenClaw data',
            timestamp: Date.now()
          })
          
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        }
      }

      // Send initial data
      sendUpdate()

      // Send updates every 3 seconds
      intervalId = setInterval(sendUpdate, 3000)

      // Send heartbeat every 30 seconds
      const heartbeatId = setInterval(() => {
        const heartbeat = JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        })
        controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`))
      }, 30000)

      // Cleanup on close
      const cleanup = () => {
        clearInterval(intervalId)
        clearInterval(heartbeatId)
      }

      // Handle client disconnect
      return cleanup
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}