"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface OnlineUser {
  id: string
  name: string
  email: string
  picture: string
  lastSeen: number
}

interface PresenceData {
  onlineCount: number
  users: OnlineUser[]
}

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  given_name: string
  family_name: string
}

export function usePresence(user: GoogleUser | null) {
  const [presenceData, setPresenceData] = useState<PresenceData>({
    onlineCount: 0,
    users: [],
  })
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Send presence update to server
  const updatePresence = useCallback(async (userData: GoogleUser) => {
    try {
      const response = await fetch("/api/presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: userData }),
      })

      if (!response.ok) {
        console.error("Failed to update presence")
      }
    } catch (error) {
      console.error("Error updating presence:", error)
    }
  }, [])

  // Remove user from presence
  const removePresence = useCallback(async (userId: string) => {
    try {
      await fetch("/api/presence", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })
    } catch (error) {
      console.error("Error removing presence:", error)
    }
  }, [])

  // Connect to SSE stream
  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource("/api/presence/stream")
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("[v0] SSE connection opened")
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("[v0] SSE message received:", data)

        if (data.type === "presence_update") {
          setPresenceData({
            onlineCount: data.onlineCount,
            users: data.users,
          })
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("[v0] SSE connection error:", error)
      setIsConnected(false)

      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (user) {
          connectToStream()
        }
      }, 5000)
    }

    eventSource.onclose = () => {
      console.log("[v0] SSE connection closed")
      setIsConnected(false)
    }
  }, [user])

  // Start heartbeat when user is signed in
  useEffect(() => {
    if (user) {
      console.log("[v0] Starting presence tracking for user:", user.name)

      // Connect to SSE stream
      connectToStream()

      // Send initial presence update
      updatePresence(user)

      // Start heartbeat interval (every 20 seconds)
      heartbeatIntervalRef.current = setInterval(() => {
        updatePresence(user)
      }, 20000)

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && user) {
          updatePresence(user)
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange)

      // Cleanup on page unload
      const handleBeforeUnload = () => {
        if (user) {
          removePresence(user.id)
        }
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    } else {
      console.log("[v0] Stopping presence tracking")

      // Clean up when user signs out
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      setIsConnected(false)
      setPresenceData({ onlineCount: 0, users: [] })
    }
  }, [user, updatePresence, removePresence, connectToStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    presenceData,
    isConnected,
    updatePresence: () => user && updatePresence(user),
  }
}
