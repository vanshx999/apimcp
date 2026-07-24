import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readSettings, writeSettings } from '@/lib/cookie-store'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = await readSettings()
  return NextResponse.json({
    configured: !!(settings.cloudflareToken && settings.accountId),
    accountId: settings.accountId || '',
    subdomain: settings.subdomain || '',
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { cloudflareToken, accountId, subdomain } = await request.json()
  if (!cloudflareToken || !accountId) {
    return NextResponse.json({ error: 'cloudflareToken and accountId are required' }, { status: 400 })
  }
  const settings = await readSettings()
  settings.cloudflareToken = cloudflareToken
  settings.accountId = accountId
  settings.subdomain = subdomain || ''
  await writeSettings(settings)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = await readSettings()
  delete settings.cloudflareToken
  delete settings.accountId
  delete settings.subdomain
  await writeSettings(settings)
  return NextResponse.json({ ok: true })
}
