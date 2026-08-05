import { readSettings, writeSettings } from './cookie-store'

const DEPLOY_LIMIT = 10
const PARSE_LIMIT = 30
const DEMO_CHAT_LIMIT = 60
const WINDOW_MS = 60 * 60 * 1000
const DEMO_CHAT_WINDOW_MS = 24 * 60 * 60 * 1000

export async function checkDeployRateLimit(): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const settings = await readSettings()
  const now = Date.now()

  if (!settings.deployRate || now - settings.deployRate.windowStart > WINDOW_MS) {
    settings.deployRate = { count: 0, windowStart: now }
  }

  const remaining = DEPLOY_LIMIT - settings.deployRate.count
  const resetIn = WINDOW_MS - (now - settings.deployRate.windowStart)

  if (settings.deployRate.count >= DEPLOY_LIMIT) {
    await writeSettings(settings)
    return { allowed: false, remaining: 0, resetIn }
  }

  settings.deployRate.count++
  await writeSettings(settings)
  return { allowed: true, remaining: remaining - 1, resetIn }
}

export async function checkParseRateLimit(): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const settings = await readSettings()
  const now = Date.now()

  if (!settings.parseRate || now - settings.parseRate.windowStart > WINDOW_MS) {
    settings.parseRate = { count: 0, windowStart: now }
  }

  const remaining = PARSE_LIMIT - settings.parseRate.count
  const resetIn = WINDOW_MS - (now - settings.parseRate.windowStart)

  if (settings.parseRate.count >= PARSE_LIMIT) {
    await writeSettings(settings)
    return { allowed: false, remaining: 0, resetIn }
  }

  settings.parseRate.count++
  await writeSettings(settings)
  return { allowed: true, remaining: remaining - 1, resetIn }
}

export async function checkDemoChatRateLimit(): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const settings = await readSettings()
  const now = Date.now()

  if (!settings.demoChatRate || now - settings.demoChatRate.windowStart > DEMO_CHAT_WINDOW_MS) {
    settings.demoChatRate = { count: 0, windowStart: now }
  }

  const remaining = DEMO_CHAT_LIMIT - settings.demoChatRate.count
  const resetIn = DEMO_CHAT_WINDOW_MS - (now - settings.demoChatRate.windowStart)

  if (settings.demoChatRate.count >= DEMO_CHAT_LIMIT) {
    await writeSettings(settings)
    return { allowed: false, remaining: 0, resetIn }
  }

  settings.demoChatRate.count++
  await writeSettings(settings)
  return { allowed: true, remaining: remaining - 1, resetIn }
}
