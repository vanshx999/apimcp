import { cookies } from 'next/headers'
import { encrypt, decrypt } from './crypto'

const COOKIE_NAME = 'apimcp-data'

export type DeploymentRecord = {
  name: string
  url: string
  specUrl: string
  createdAt: string
  toolsCount: number
}

export type RateLimitInfo = {
  count: number
  windowStart: number
}

export type UserSettings = {
  cloudflareToken?: string
  accountId?: string
  subdomain?: string
  deployments: DeploymentRecord[]
  deployRate?: RateLimitInfo
  parseRate?: RateLimitInfo
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

export async function addDeployment(record: DeploymentRecord): Promise<void> {
  const settings = await readSettings()
  settings.deployments = [record, ...settings.deployments].slice(0, 50)
  await writeSettings(settings)
}
