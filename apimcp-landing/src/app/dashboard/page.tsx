import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { readOwnSettings } from "@/lib/cookie-store"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const settings = await readOwnSettings(session.user?.email || session.user?.id || '')
  let cfWorkers: { name: string; url: string; modified_on: string }[] = []

  if (settings.cloudflareToken && settings.accountId) {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/workers/scripts`,
        { headers: { Authorization: `Bearer ${settings.cloudflareToken}` } }
      )
      if (res.ok) {
        const data = await res.json()
        cfWorkers = (data.result || []).map((w: any) => ({
          name: w.id,
          url: `https://${w.id}.${settings.subdomain || 'vanshmehndiratta13'}.workers.dev`,
          modified_on: w.created_on || '',
        }))
      }
    } catch {}
  }

  return (
    <DashboardClient
      deployments={settings.deployments}
      cfWorkers={cfWorkers}
      user={session.user}
      hasOwnToken={!!settings.cloudflareToken}
    />
  )
}
