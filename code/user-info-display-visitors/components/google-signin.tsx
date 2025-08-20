"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, LogOut } from "lucide-react"

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  given_name: string
  family_name: string
}

interface GoogleSignInProps {
  user: GoogleUser | null
  onSignIn: (user: GoogleUser) => void
  onSignOut: () => void
}

declare global {
  interface Window {
    google: any
  }
}

export function GoogleSignIn({ user, onSignIn, onSignOut }: GoogleSignInProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.google && !user) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          use_fedcm_for_prompt: true, // Enable FedCM
        })

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          })
        }

        // Enable One Tap with error handling
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("[v0] One Tap not displayed:", notification.getNotDisplayedReason())
          }
        })
      } catch (error) {
        console.error("[v0] Google Sign-In initialization error:", error)
      }
    }
  }, [user])

  const handleCredentialResponse = (response: any) => {
    try {
      const payload = JSON.parse(atob(response.credential.split(".")[1]))
      const googleUser: GoogleUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      }
      onSignIn(googleUser)
    } catch (error) {
      console.error("Error parsing Google credential:", error)
    }
  }

  const handleSignOut = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    onSignOut()
  }

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Google Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={user.picture || "/placeholder.svg"} alt={user.name} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="font-medium">User ID:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {user.id}
              </Badge>
            </div>
            <div>
              <span className="font-medium">First Name:</span>
              <span className="ml-2">{user.given_name}</span>
            </div>
            <div>
              <span className="font-medium">Last Name:</span>
              <span className="ml-2">{user.family_name}</span>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full bg-transparent">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Google Sign-In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in with your Google account to personalize your digital fingerprint
        </p>
        <div ref={googleButtonRef} className="w-full" />
      </CardContent>
    </Card>
  )
}
