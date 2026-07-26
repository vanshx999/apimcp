export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    const posthog = require('posthog-js').default
    posthog.capture(event, properties)
  } catch {}
}
