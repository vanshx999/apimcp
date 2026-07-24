import { cookies } from 'next/headers'
import { encrypt, decrypt } from './crypto'

const COOKIE_NAME = 'apimcp-data'

export type DeploymentRecord = {
  name: string
  url: string
  specUrl: string
  createdAt: string
  toolsCount: number
  groupCount?: number
}

export type RateLimitInfo = {
  count: number
  windowStart: number
}

export type UserSettings = {
  uid?: string
  cloudflareToken?: string
  accountId?: string
  subdomain?: string
  deployments: DeploymentRecord[]
  deployRate?: RateLimitInfo
  parseRate?: RateLimitInfo
}

export function hashId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function readSettings(): Promise<UserSettings> {
  try {
    const raw = (await cookies()).get(COOKIE_NAME)?.value
    if (!raw) return { deployments: [] }
    const decrypted = decrypt(raw)
    return JSON.parse(decrypted)
  } catch {
    return { deployments: [] }
  }
}

export async function readOwnSettings(userId: string): Promise<UserSettings> {
  const settings = await readSettings()
  if (settings.uid && settings.uid !== hashId(userId)) {
    return { deployments: [] }
  }
  return settings
}

export async function writeSettings(settings: UserSettings): Promise<void> {
  const encrypted = encrypt(JSON.stringify(settings))
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encrypted, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function addDeployment(record: DeploymentRecord, userId?: string): Promise<void> {
  const settings = userId ? await readOwnSettings(userId) : await readSettings()
  if (userId && !settings.uid) settings.uid = hashId(userId)
  settings.deployments = [record, ...settings.deployments].slice(0, 50)
  await writeSettings(settings)
}
