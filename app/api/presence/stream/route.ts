import type { NextRequest } from "next/server"

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>()

// Broadcast to all connected clients
export function broadcastPresenceUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`

  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      // Remove broken connections
      connections.delete(controller)
    }
  })
}

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller)

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: "connected",
        message: "Connected to presence stream",
      })}\n\n`

      controller.enqueue(new TextEncoder().encode(initialMessage))

      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: Date.now(),
          })}\n\n`

          controller.enqueue(new TextEncoder().encode(heartbeatMessage))
        } catch (error) {
          clearInterval(heartbeat)
          connections.delete(controller)
        }
      }, 25000) // Send heartbeat every 25 seconds

      // Cleanup when connection closes
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        connections.delete(controller)
        try {
          controller.close()
        } catch (error) {
          // Connection already closed
        }
      })
    },

    cancel() {
      // Connection was cancelled by client
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
