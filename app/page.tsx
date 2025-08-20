"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GoogleSignIn } from "@/components/google-signin"
import { usePresence } from "@/hooks/use-presence"
import { OnlineUsers } from "@/components/online-users"
import {
  Globe,
  Monitor,
  Smartphone,
  Wifi,
  Shield,
  Clock,
  Battery,
  Camera,
  Gamepad2,
  Navigation,
  Fingerprint,
  Palette,
} from "lucide-react"
import html2canvas from "html2canvas"

interface UserInfo {
  publicIP: string
  isp: string
  location: {
    city: string
    region: string
    country: string
    timezone: string
    lat: number
    lon: number
  }
  browser: {
    name: string
    version: string
    userAgent: string
    language: string
    languages: string[]
    cookieEnabled: boolean
    onLine: boolean
    platform: string
  }
  os: {
    name: string
    version: string
  }
  device: {
    type: string
    vendor: string
    model: string
    touchSupport: boolean
    maxTouchPoints: number
  }
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelRatio: number
    orientation: string
  }
  viewport: {
    width: number
    height: number
  }
  hardware: {
    cpuCores: number
    memory: number
    platform: string
  }
  webrtc: {
    localIPs: string[]
    publicIP: string
    supported: boolean
  }
  network: {
    connection: string
    downlink: number
    effectiveType: string
  }
  security: {
    cookiesEnabled: boolean
    doNotTrack: boolean
    javaEnabled: boolean
  }
  graphics: {
    webglSupported: boolean
    vendor: string
    renderer: string
    canvasFingerprint: string
  }
  capabilities: {
    localStorage: boolean
    sessionStorage: boolean
    indexedDB: boolean
    webWorkers: boolean
    serviceWorkers: boolean
    geolocation: boolean
    notifications: string
    battery: {
      supported: boolean
      level: number
      charging: boolean
    }
  }
  session: {
    referrer: string
    timestamp: string
    timezoneOffset: number
    userTimezone: string
  }
  media: {
    cameras: MediaDeviceInfo[]
    microphones: MediaDeviceInfo[]
    speakers: MediaDeviceInfo[]
    cameraAccess: boolean
    microphoneAccess: boolean
    screenCaptureSupported: boolean
    capturedPhoto: string | null
    capturedAudio: string | null
  }
  sensors: {
    accelerometer: boolean
    gyroscope: boolean
    magnetometer: boolean
    ambientLight: boolean
    proximity: boolean
    vibration: boolean
  }
  advanced: {
    gamepad: boolean
    bluetooth: boolean
    usb: boolean
    clipboard: boolean
    wakeLock: boolean
    fullscreen: boolean
    pointerLock: boolean
  }
}

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  given_name: string
  family_name: string
}

export default function UserInfoDisplay() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screenshotLoading, setScreenshotLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)

  const { presenceData, isConnected } = usePresence(googleUser)

  const fetchUserInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      const ipResponse = await fetch("https://ipapi.co/json/")
      const ipData = await ipResponse.json()

      const userAgent = navigator.userAgent
      const browserInfo = getBrowserInfo(userAgent)
      const osInfo = getOSInfo(userAgent)
      const deviceInfo = getDeviceInfo(userAgent)

      const hardwareInfo = getHardwareInfo()

      const webrtcInfo = await getWebRTCInfo()

      const networkInfo = getNetworkInfo()

      const securityInfo = getSecurityInfo()

      const graphicsInfo = await getGraphicsInfo()

      const capabilitiesInfo = await getCapabilitiesInfo()

      const sessionInfo = getSessionInfo()

      const mediaInfo = await getMediaInfo()
      const sensorsInfo = getSensorsInfo()
      const advancedInfo = getAdvancedInfo()

      const info: UserInfo = {
        publicIP: ipData.ip || "Unknown",
        isp: ipData.org || "Unknown",
        location: {
          city: ipData.city || "Unknown",
          region: ipData.region || "Unknown",
          country: ipData.country_name || "Unknown",
          timezone: ipData.timezone || "Unknown",
          lat: ipData.latitude || 0,
          lon: ipData.longitude || 0,
        },
        browser: browserInfo,
        os: osInfo,
        device: deviceInfo,
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          orientation: screen.orientation?.type || "Unknown",
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        hardware: hardwareInfo,
        webrtc: webrtcInfo,
        network: networkInfo,
        security: securityInfo,
        graphics: graphicsInfo,
        capabilities: capabilitiesInfo,
        session: sessionInfo,
        media: mediaInfo,
        sensors: sensorsInfo,
        advanced: advancedInfo,
      }

      setUserInfo(info)
    } catch (err) {
      setError("Failed to fetch user information")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const captureScreenshot = async () => {
    try {
      if (loading || !userInfo) {
        setError("Please wait for all information to load before taking a screenshot")
        return
      }

      setScreenshotLoading(true)

      const tempStyle = document.createElement("style")
      tempStyle.textContent = `
        /* Preserve existing styles while ensuring visibility */
        body * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Convert modern CSS to compatible formats */
        .bg-background { background-color: #ffffff !important; }
        .text-foreground { color: #0f172a !important; }
        .bg-card { background-color: #f8fafc !important; }
        .text-card-foreground { color: #1e293b !important; }
        .bg-primary { background-color: #3b82f6 !important; }
        .text-primary-foreground { color: #ffffff !important; }
        .bg-secondary { background-color: #f1f5f9 !important; }
        .text-secondary-foreground { color: #475569 !important; }
        .bg-muted { background-color: #f8fafc !important; }
        .text-muted-foreground { color: #64748b !important; }
        .border { border-color: #e2e8f0 !important; }
        .border-border { border-color: #e2e8f0 !important; }
        
        /* Ensure gradients are visible */
        .bg-gradient-to-r { background: linear-gradient(to right, #3b82f6, #1d4ed8) !important; }
        .bg-gradient-to-br { background: linear-gradient(to bottom right, #3b82f6, #1d4ed8) !important; }
        
        /* Fix text colors for better contrast */
        .text-blue-600 { color: #2563eb !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-yellow-600 { color: #ca8a04 !important; }
        .text-purple-600 { color: #9333ea !important; }
        
        /* Ensure shadows are visible */
        .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
        .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
      `
      document.head.appendChild(tempStyle)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const canvas = await html2canvas(document.body, {
        height: window.innerHeight,
        width: window.innerWidth,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        scale: 1, // Increased scale for better quality
        backgroundColor: "#ffffff",
        removeContainer: false, // Keep container for better layout
        foreignObjectRendering: true, // Better CSS support
        imageTimeout: 15000,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedStyle = clonedDoc.createElement("style")
          clonedStyle.textContent = `
            * { 
              font-family: system-ui, -apple-system, sans-serif !important;
              box-sizing: border-box !important;
            }
            body { 
              margin: 0 !important; 
              padding: 20px !important;
              background: #ffffff !important;
            }
          `
          clonedDoc.head.appendChild(clonedStyle)
        },
        ignoreElements: (element) => {
          return element.tagName === "SCRIPT" || element.tagName === "NOSCRIPT"
        },
      })

      document.head.removeChild(tempStyle)

      const dataURL = canvas.toDataURL("image/png", 0.95) // Higher quality
      setScreenshot(dataURL)
    } catch (err) {
      console.error("Error capturing screenshot:", err)
      try {
        const fallbackCanvas = document.createElement("canvas")
        fallbackCanvas.width = window.innerWidth
        fallbackCanvas.height = window.innerHeight
        const ctx = fallbackCanvas.getContext("2d")

        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height)
          ctx.fillStyle = "#000000"
          ctx.font = "16px Arial"
          ctx.fillText("Screenshot capture failed due to CSS compatibility", 50, 100)
          ctx.fillText("Modern CSS features (oklch colors) are not supported", 50, 130)
          ctx.fillText("This is a technical limitation of the screenshot library", 50, 160)

          const fallbackDataURL = fallbackCanvas.toDataURL("image/png")
          setScreenshot(fallbackDataURL)
        } else {
          setError("Screenshot capture not supported in this environment")
        }
      } catch (fallbackErr) {
        console.error("Fallback screenshot also failed:", fallbackErr)
        setError("Screenshot capture failed - CSS compatibility issue")
      }
    } finally {
      setScreenshotLoading(false)
    }
  }

  const capturePhoto = async () => {
    if (!userInfo?.media.cameraAccess) return

    setIsCapturingPhoto(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.srcObject = stream
      video.play()

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx?.drawImage(video, 0, 0)

        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)

        setUserInfo((prev) =>
          prev
            ? {
                ...prev,
                media: { ...prev.media, capturedPhoto: photoDataUrl },
              }
            : null,
        )

        stream.getTracks().forEach((track) => track.stop())
        setIsCapturingPhoto(false)
      }
    } catch (err) {
      console.error("Error capturing photo:", err)
      setIsCapturingPhoto(false)
    }
  }

  const recordAudio = async () => {
    if (!userInfo?.media.microphoneAccess) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)

        setUserInfo((prev) =>
          prev
            ? {
                ...prev,
                media: { ...prev.media, capturedAudio: audioUrl },
              }
            : null,
        )

        stream.getTracks().forEach((track) => track.stop())
        setIsRecordingAudio(false)
        setRecordingTimer(0)
      }

      setAudioRecorder(recorder)
      setIsRecordingAudio(true)
      recorder.start()

      let timer = 3
      setRecordingTimer(timer)
      const interval = setInterval(() => {
        timer--
        setRecordingTimer(timer)
        if (timer <= 0) {
          clearInterval(interval)
          recorder.stop()
        }
      }, 1000)
    } catch (err) {
      console.error("Error recording audio:", err)
      setIsRecordingAudio(false)
    }
  }

  const testCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (err) {
      return false
    }
  }

  const testMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (err) {
      return false
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const getBrowserInfo = (userAgent: string) => {
    let name = "Unknown"
    let version = "Unknown"

    if (userAgent.includes("Chrome")) {
      name = "Chrome"
      version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown"
    } else if (userAgent.includes("Firefox")) {
      name = "Firefox"
      version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown"
    } else if (userAgent.includes("Safari")) {
      name = "Safari"
      version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || "Unknown"
    } else if (userAgent.includes("Edge")) {
      name = "Edge"
      version = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || "Unknown"
    }

    return {
      name,
      version,
      userAgent,
      language: navigator.language,
      languages: navigator.languages || [],
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      platform: navigator.platform,
    }
  }

  const getOSInfo = (userAgent: string) => {
    let name = "Unknown"
    let version = "Unknown"

    if (userAgent.includes("Windows NT")) {
      name = "Windows"
      const match = userAgent.match(/Windows NT ([0-9.]+)/)
      if (match) {
        const ntVersion = match[1]
        const windowsVersions: { [key: string]: string } = {
          "10.0": "10/11",
          "6.3": "8.1",
          "6.2": "8",
          "6.1": "7",
        }
        version = windowsVersions[ntVersion] || ntVersion
      }
    } else if (userAgent.includes("Mac OS X")) {
      name = "macOS"
      version = userAgent.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, ".") || "Unknown"
    } else if (userAgent.includes("Linux")) {
      name = "Linux"
    } else if (userAgent.includes("Android")) {
      name = "Android"
      version = userAgent.match(/Android ([0-9.]+)/)?.[1] || "Unknown"
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
      name = "iOS"
      version = userAgent.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, ".") || "Unknown"
    }

    return { name, version }
  }

  const getDeviceInfo = (userAgent: string) => {
    let type = "Desktop"
    let vendor = "Unknown"
    let model = "Unknown"

    if (userAgent.includes("Mobile")) {
      type = "Mobile"
    } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      type = "Tablet"
    }

    if (userAgent.includes("iPhone")) {
      vendor = "Apple"
      model = "iPhone"
    } else if (userAgent.includes("iPad")) {
      vendor = "Apple"
      model = "iPad"
    } else if (userAgent.includes("Samsung")) {
      vendor = "Samsung"
    } else if (userAgent.includes("Pixel")) {
      vendor = "Google"
      model = "Pixel"
    }

    return {
      type,
      vendor,
      model,
      touchSupport: "ontouchstart" in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    }
  }

  const getHardwareInfo = () => {
    return {
      cpuCores: navigator.hardwareConcurrency || 0,
      memory: (navigator as any).deviceMemory || 0,
      platform: navigator.platform,
    }
  }

  const getWebRTCInfo = async (): Promise<UserInfo["webrtc"]> => {
    return new Promise((resolve) => {
      const localIPs: string[] = []
      const publicIP = "Unknown"

      if (!window.RTCPeerConnection) {
        resolve({ localIPs, publicIP, supported: false })
        return
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      })

      pc.createDataChannel("")
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ip = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/)?.[0]
          if (ip && !localIPs.includes(ip)) {
            localIPs.push(ip)
          }
        }
      }

      setTimeout(() => {
        pc.close()
        resolve({ localIPs, publicIP, supported: true })
      }, 2000)
    })
  }

  const getNetworkInfo = () => {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    return {
      connection: connection?.type || "Unknown",
      downlink: connection?.downlink || 0,
      effectiveType: connection?.effectiveType || "Unknown",
    }
  }

  const getSecurityInfo = () => {
    return {
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === "1",
      javaEnabled: (navigator as any).javaEnabled?.() || false,
    }
  }

  const getGraphicsInfo = async (): Promise<UserInfo["graphics"]> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.textBaseline = "top"
      ctx.font = "14px Arial"
      ctx.fillText("Canvas fingerprint test 🎨", 2, 2)
    }
    const canvasFingerprint = canvas.toDataURL().slice(-50)

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    let vendor = "Unknown"
    let renderer = "Unknown"
    let webglSupported = false

    if (gl) {
      webglSupported = true
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Unknown"
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown"
      }
    }

    return {
      webglSupported,
      vendor,
      renderer,
      canvasFingerprint,
    }
  }

  const getCapabilitiesInfo = async (): Promise<UserInfo["capabilities"]> => {
    let batteryInfo = {
      supported: false,
      level: 0,
      charging: false,
    }

    try {
      const battery = await (navigator as any).getBattery?.()
      if (battery) {
        batteryInfo = {
          supported: true,
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        }
      }
    } catch (e) {}

    let notificationStatus = "Unknown"
    if ("Notification" in window) {
      notificationStatus = Notification.permission
    }

    return {
      localStorage: typeof Storage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
      indexedDB: typeof indexedDB !== "undefined",
      webWorkers: typeof Worker !== "undefined",
      serviceWorkers: "serviceWorker" in navigator,
      geolocation: "geolocation" in navigator,
      notifications: notificationStatus,
      battery: batteryInfo,
    }
  }

  const getSessionInfo = () => {
    const now = new Date()
    return {
      referrer: document.referrer || "Direct",
      timestamp: now.toISOString(),
      timezoneOffset: now.getTimezoneOffset(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }

  const getMediaInfo = async (): Promise<UserInfo["media"]> => {
    let cameras: MediaDeviceInfo[] = []
    let microphones: MediaDeviceInfo[] = []
    let speakers: MediaDeviceInfo[] = []
    let cameraAccess = false
    let microphoneAccess = false

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices()
        cameras = devices.filter((device) => device.kind === "videoinput")
        microphones = devices.filter((device) => device.kind === "audioinput")
        speakers = devices.filter((device) => device.kind === "audiooutput")
      }

      cameraAccess = await testCameraAccess()
      microphoneAccess = await testMicrophoneAccess()
    } catch (err) {
      console.error("Error getting media info:", err)
    }

    return {
      cameras,
      microphones,
      speakers,
      cameraAccess,
      microphoneAccess,
      screenCaptureSupported: typeof window !== "undefined",
      capturedPhoto: null,
      capturedAudio: null,
    }
  }

  const getSensorsInfo = (): UserInfo["sensors"] => {
    return {
      accelerometer: "DeviceMotionEvent" in window,
      gyroscope: "DeviceOrientationEvent" in window,
      magnetometer: "DeviceOrientationEvent" in window && "webkitCompassHeading" in DeviceOrientationEvent.prototype,
      ambientLight: "AmbientLightSensor" in window,
      proximity: "ProximitySensor" in window,
      vibration: "vibrate" in navigator,
    }
  }

  const getAdvancedInfo = (): UserInfo["advanced"] => {
    return {
      gamepad: "getGamepads" in navigator,
      bluetooth: "bluetooth" in navigator,
      usb: "usb" in navigator,
      clipboard: "clipboard" in navigator,
      wakeLock: "wakeLock" in navigator,
      fullscreen: "requestFullscreen" in document.documentElement,
      pointerLock: "requestPointerLock" in document.documentElement,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Gathering your digital fingerprint...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={fetchUserInfo} className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Your Digital Fingerprint</h1>
          <p className="text-muted-foreground">Complete information about your device, browser, and network</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchUserInfo} variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={captureScreenshot} variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Capture Screenshot
            </Button>
          </div>
        </div>

        <GoogleSignIn user={googleUser} onSignIn={setGoogleUser} onSignOut={() => setGoogleUser(null)} />

        <OnlineUsers
          onlineCount={presenceData.onlineCount}
          users={presenceData.users}
          isConnected={isConnected}
          currentUserId={googleUser?.id}
        />

        <video ref={videoRef} style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {screenshot && (
          <Card>
            <CardHeader>
              <CardTitle>Page Screenshot</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={screenshot || "/placeholder.svg"}
                alt="Page Screenshot"
                className="w-full max-w-md mx-auto rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Network & IP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Public IP:</span>
                <Badge variant="secondary" className="ml-2">
                  {userInfo?.publicIP}
                </Badge>
              </div>
              <div>
                <span className="font-medium">ISP:</span>
                <p className="text-sm text-muted-foreground mt-1">{userInfo?.isp}</p>
              </div>
              <div>
                <span className="font-medium">Connection:</span>
                <Badge variant="outline" className="ml-2">
                  {userInfo?.network.connection}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Speed:</span>
                <span className="ml-2">
                  {userInfo?.network.downlink} Mbps ({userInfo?.network.effectiveType})
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant={userInfo?.browser.onLine ? "default" : "destructive"} className="ml-2">
                  {userInfo?.browser.onLine ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Location & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">City:</span>
                <span className="ml-2">{userInfo?.location.city}</span>
              </div>
              <div>
                <span className="font-medium">Region:</span>
                <span className="ml-2">{userInfo?.location.region}</span>
              </div>
              <div>
                <span className="font-medium">Country:</span>
                <span className="ml-2">{userInfo?.location.country}</span>
              </div>
              <div>
                <span className="font-medium">Timezone:</span>
                <span className="ml-2">{userInfo?.session.userTimezone}</span>
              </div>
              <div>
                <span className="font-medium">Coordinates:</span>
                <span className="ml-2 text-sm">
                  {userInfo?.location.lat}, {userInfo?.location.lon}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Browser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Browser:</span>
                <Badge className="ml-2">
                  {userInfo?.browser.name} {userInfo?.browser.version}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Language:</span>
                <Badge variant="outline" className="ml-2">
                  {userInfo?.browser.language}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Platform:</span>
                <span className="ml-2">{userInfo?.browser.platform}</span>
              </div>
              <div>
                <span className="font-medium">User Agent:</span>
                <p className="text-xs text-muted-foreground mt-1 break-all">{userInfo?.browser.userAgent}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                System & Hardware
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">OS:</span>
                <Badge variant="secondary" className="ml-2">
                  {userInfo?.os.name} {userInfo?.os.version}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Device:</span>
                <span className="ml-2">{userInfo?.device.type}</span>
              </div>
              <div>
                <span className="font-medium">CPU Cores:</span>
                <span className="ml-2">{userInfo?.hardware.cpuCores || "Unknown"}</span>
              </div>
              <div>
                <span className="font-medium">Memory:</span>
                <span className="ml-2">{userInfo?.hardware.memory ? `${userInfo.hardware.memory} GB` : "Unknown"}</span>
              </div>
              <div>
                <span className="font-medium">Touch:</span>
                <Badge variant={userInfo?.device.touchSupport ? "default" : "secondary"} className="ml-2">
                  {userInfo?.device.touchSupport ? `Yes (${userInfo.device.maxTouchPoints} points)` : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Screen:</span>
                <span className="ml-2">
                  {userInfo?.screen.width} × {userInfo?.screen.height}
                </span>
              </div>
              <div>
                <span className="font-medium">Available:</span>
                <span className="ml-2">
                  {userInfo?.screen.availWidth} × {userInfo?.screen.availHeight}
                </span>
              </div>
              <div>
                <span className="font-medium">Viewport:</span>
                <span className="ml-2">
                  {userInfo?.viewport.width} × {userInfo?.viewport.height}
                </span>
              </div>
              <div>
                <span className="font-medium">Color Depth:</span>
                <span className="ml-2">{userInfo?.screen.colorDepth}-bit</span>
              </div>
              <div>
                <span className="font-medium">Pixel Ratio:</span>
                <span className="ml-2">{userInfo?.screen.pixelRatio}x</span>
              </div>
              <div>
                <span className="font-medium">Orientation:</span>
                <span className="ml-2">{userInfo?.screen.orientation}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Graphics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">WebGL:</span>
                <Badge variant={userInfo?.graphics.webglSupported ? "default" : "destructive"} className="ml-2">
                  {userInfo?.graphics.webglSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Vendor:</span>
                <p className="text-sm text-muted-foreground mt-1">{userInfo?.graphics.vendor}</p>
              </div>
              <div>
                <span className="font-medium">Renderer:</span>
                <p className="text-sm text-muted-foreground mt-1">{userInfo?.graphics.renderer}</p>
              </div>
              <div>
                <span className="font-medium">Canvas ID:</span>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{userInfo?.graphics.canvasFingerprint}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                WebRTC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Supported:</span>
                <Badge variant={userInfo?.webrtc.supported ? "default" : "destructive"} className="ml-2">
                  {userInfo?.webrtc.supported ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Local IPs:</span>
                <div className="mt-1 space-y-1">
                  {userInfo?.webrtc.localIPs.map((ip, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ip}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Local Storage:</span>
                  <Badge variant={userInfo?.capabilities.localStorage ? "default" : "secondary"} className="text-xs">
                    {userInfo?.capabilities.localStorage ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Web Workers:</span>
                  <Badge variant={userInfo?.capabilities.webWorkers ? "default" : "secondary"} className="text-xs">
                    {userInfo?.capabilities.webWorkers ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Service Workers:</span>
                  <Badge variant={userInfo?.capabilities.serviceWorkers ? "default" : "secondary"} className="text-xs">
                    {userInfo?.capabilities.serviceWorkers ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Geolocation:</span>
                  <Badge variant={userInfo?.capabilities.geolocation ? "default" : "secondary"} className="text-xs">
                    {userInfo?.capabilities.geolocation ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="font-medium">Notifications:</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {userInfo?.capabilities.notifications}
                </Badge>
              </div>
              {userInfo?.capabilities.battery.supported && (
                <div>
                  <span className="font-medium">Battery:</span>
                  <span className="ml-2">
                    {userInfo.capabilities.battery.level}%
                    {userInfo.capabilities.battery.charging ? " (Charging)" : " (Not Charging)"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cookies Enabled:</span>
                  <Badge variant={userInfo?.security.cookiesEnabled ? "default" : "destructive"}>
                    {userInfo?.security.cookiesEnabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Do Not Track:</span>
                  <Badge variant={userInfo?.security.doNotTrack ? "default" : "secondary"}>
                    {userInfo?.security.doNotTrack ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Java Enabled:</span>
                  <Badge variant={userInfo?.security.javaEnabled ? "default" : "secondary"}>
                    {userInfo?.security.javaEnabled ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Referrer:</span>
                  <Badge variant="outline" className="text-xs max-w-32 truncate">
                    {userInfo?.session.referrer}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Session started:</span> {userInfo?.session.timestamp}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Media Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Cameras:</span>
                <Badge variant="secondary" className="ml-2">
                  {userInfo?.media.cameras.length || 0}
                </Badge>
                <Badge variant={userInfo?.media.cameraAccess ? "default" : "destructive"} className="ml-1 text-xs">
                  {userInfo?.media.cameraAccess ? "Access Granted" : "No Access"}
                </Badge>
                {userInfo?.media.cameraAccess && (
                  <Button onClick={capturePhoto} disabled={isCapturingPhoto} size="sm" className="ml-2">
                    {isCapturingPhoto ? "Capturing..." : "Take Photo"}
                  </Button>
                )}
              </div>
              <div>
                <span className="font-medium">Microphones:</span>
                <Badge variant="secondary" className="ml-2">
                  {userInfo?.media.microphones.length || 0}
                </Badge>
                <Badge variant={userInfo?.media.microphoneAccess ? "default" : "destructive"} className="ml-1 text-xs">
                  {userInfo?.media.microphoneAccess ? "Access Granted" : "No Access"}
                </Badge>
                {userInfo?.media.microphoneAccess && (
                  <Button onClick={recordAudio} disabled={isRecordingAudio} size="sm" className="ml-2">
                    {isRecordingAudio ? `Recording... ${recordingTimer}s` : "Record 3s Audio"}
                  </Button>
                )}
              </div>
              <div>
                <span className="font-medium">Speakers:</span>
                <Badge variant="secondary" className="ml-2">
                  {userInfo?.media.speakers.length || 0}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Screen Capture:</span>
                <Badge variant={userInfo?.media.screenCaptureSupported ? "default" : "secondary"} className="ml-2">
                  {userInfo?.media.screenCaptureSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>

              {userInfo?.media.capturedPhoto && (
                <div className="mt-4">
                  <span className="font-medium text-sm">Captured Photo:</span>
                  <div className="mt-2">
                    <img
                      src={userInfo.media.capturedPhoto || "/placeholder.svg"}
                      alt="Captured from webcam"
                      className="max-w-full h-32 object-cover rounded border"
                    />
                  </div>
                </div>
              )}

              {userInfo?.media.capturedAudio && (
                <div className="mt-4">
                  <span className="font-medium text-sm">Captured Audio (3s):</span>
                  <div className="mt-2">
                    <audio src={userInfo.media.capturedAudio} controls className="w-full max-w-sm" />
                  </div>
                </div>
              )}

              {userInfo?.media.cameras.map((camera, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  📹 {camera.label || `Camera ${index + 1}`}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Sensors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Accelerometer:</span>
                  <Badge variant={userInfo?.sensors.accelerometer ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.accelerometer ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Gyroscope:</span>
                  <Badge variant={userInfo?.sensors.gyroscope ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.gyroscope ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Magnetometer:</span>
                  <Badge variant={userInfo?.sensors.magnetometer ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.magnetometer ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Ambient Light:</span>
                  <Badge variant={userInfo?.sensors.ambientLight ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.ambientLight ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Proximity:</span>
                  <Badge variant={userInfo?.sensors.proximity ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.proximity ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Vibration:</span>
                  <Badge variant={userInfo?.sensors.vibration ? "default" : "secondary"} className="text-xs">
                    {userInfo?.sensors.vibration ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Advanced APIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Gamepad:</span>
                  <Badge variant={userInfo?.advanced.gamepad ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.gamepad ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Bluetooth:</span>
                  <Badge variant={userInfo?.advanced.bluetooth ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.bluetooth ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>USB:</span>
                  <Badge variant={userInfo?.advanced.usb ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.usb ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Clipboard:</span>
                  <Badge variant={userInfo?.advanced.clipboard ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.clipboard ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Wake Lock:</span>
                  <Badge variant={userInfo?.advanced.wakeLock ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.wakeLock ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Fullscreen:</span>
                  <Badge variant={userInfo?.advanced.fullscreen ? "default" : "secondary"} className="text-xs">
                    {userInfo?.advanced.fullscreen ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            This information is collected client-side and shows what websites can typically access about your device and
            connection. Some features require user permission.
          </p>
        </div>
      </div>
    </div>
  )
}
