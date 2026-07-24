import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { readOwnSettings, writeSettings, hashId } from '@/lib/cookie-store'

function getUserId(s: any): string {
  return s?.user?.email || s?.user?.id || ''
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = await readOwnSettings(getUserId(session))
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
  const uid = getUserId(session)
  const settings = await readOwnSettings(uid)
  settings.uid = hashId(uid)
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
  const uid = getUserId(session)
  const settings = await readOwnSettings(uid)
  delete settings.cloudflareToken
  delete settings.accountId
  delete settings.subdomain
  delete settings.uid
  await writeSettings(settings)
  return NextResponse.json({ ok: true })
}
