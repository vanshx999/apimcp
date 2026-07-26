'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import posthog from 'posthog-js'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const initialized = useRef(false)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || initialized.current) return
    initialized.current = true
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: true,
      disable_session_recording: true,
      person_profiles: 'always',
    })
  }, [])

  useEffect(() => {
    if (!posthog) return
    if (session?.user?.email) {
      posthog.identify(session.user.email, {
        name: session.user.name,
        email: session.user.email,
      })
    } else {
      posthog.reset()
    }
  }, [session])

  return <>{children}</>
}
