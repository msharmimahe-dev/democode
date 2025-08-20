import { type NextRequest, NextResponse } from "next/server"
import { broadcastPresenceUpdate } from "./stream/route"

// In-memory store for active users (in production, use Redis or database)
const activeUsers = new Map<
  string,
  {
    id: string
    name: string
    email: string
    picture: string
    lastSeen: number
  }
>()

// Cleanup inactive users (older than 30 seconds)
function cleanupInactiveUsers() {
  const now = Date.now()
  const timeout = 30000 // 30 seconds

  for (const [userId, user] of activeUsers.entries()) {
    if (now - user.lastSeen > timeout) {
      activeUsers.delete(userId)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json()

    if (!user || !user.id) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
    }

    // Update user presence
    activeUsers.set(user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      lastSeen: Date.now(),
    })

    // Cleanup inactive users
    cleanupInactiveUsers()

    const responseData = {
      success: true,
      onlineCount: activeUsers.size,
      users: Array.from(activeUsers.values()),
    }

    broadcastPresenceUpdate({
      type: "presence_update",
      onlineCount: activeUsers.size,
      users: Array.from(activeUsers.values()),
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Presence API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  cleanupInactiveUsers()

  return NextResponse.json({
    onlineCount: activeUsers.size,
    users: Array.from(activeUsers.values()),
  })
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (userId) {
      activeUsers.delete(userId)
    }

    const responseData = {
      success: true,
      onlineCount: activeUsers.size,
    }

    broadcastPresenceUpdate({
      type: "presence_update",
      onlineCount: activeUsers.size,
      users: Array.from(activeUsers.values()),
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Presence DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
