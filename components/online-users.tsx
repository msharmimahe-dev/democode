"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Wifi, WifiOff } from "lucide-react"

interface OnlineUser {
  id: string
  name: string
  email: string
  picture: string
  lastSeen: number
}

interface OnlineUsersProps {
  onlineCount: number
  users: OnlineUser[]
  isConnected: boolean
  currentUserId?: string
}

export function OnlineUsers({ onlineCount, users, isConnected, currentUserId }: OnlineUsersProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-green-600" />
            People Online
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={`flex items-center gap-1 ${
                isConnected
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? "Live" : "Offline"}
            </Badge>
            <Badge variant="outline" className="font-semibold">
              {onlineCount} {onlineCount === 1 ? "person" : "people"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {onlineCount === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No one is online right now</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to sign in!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Online count summary */}
            <div className="text-sm text-gray-600 border-b pb-2">
              {onlineCount === 1 ? "1 person is" : `${onlineCount} people are`} currently online
            </div>

            {/* Users grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    user.id === currentUserId
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.id === currentUserId ? "You" : user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Last updated indicator */}
            {isConnected && <div className="text-xs text-gray-400 text-center pt-2 border-t">Updates in real-time</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
