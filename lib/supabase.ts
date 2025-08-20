import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export interface VisitorLocation {
  country?: string
  city?: string
  region?: string
  timezone?: string
}

export interface OnlineVisitor {
  id: string
  location: VisitorLocation
  joinedAt: number
}

// Utility to generate unique visitor ID
export function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
