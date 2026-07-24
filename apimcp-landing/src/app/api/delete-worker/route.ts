import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readOwnSettings, writeSettings } from '@/lib/cookie-store'

function getUserId(s: any): string {
  return s?.user?.email || s?.user?.id || ''
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name) {
    return NextResponse.json({ error: 'Worker name is required' }, { status: 400 })
  }

  const userId = getUserId(session)
  const settings = await readOwnSettings(userId)

  const cfToken = settings.cloudflareToken
  const accountId = settings.accountId

  if (!cfToken || !accountId) {
    return NextResponse.json({ error: 'Connect your Cloudflare account first on the Dashboard' }, { status: 400 })
  }

  const cfRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${cfToken}` } }
  )

  if (!cfRes.ok) {
    const text = await cfRes.text()
    return NextResponse.json({ error: `Failed to delete: ${text.slice(0, 200)}` }, { status: 500 })
  }

  settings.deployments = settings.deployments.filter(d => d.name !== name)
  await writeSettings(settings)

  return NextResponse.json({ ok: true })
}
