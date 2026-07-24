'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import type { DeploymentRecord } from '@/lib/cookie-store'

type Props = {
  deployments: DeploymentRecord[]
  cfWorkers: { name: string; url: string; modified_on: string }[]
  user: { name?: string | null; email?: string | null; image?: string | null }
  hasOwnToken: boolean
}

export default function DashboardClient({ deployments, cfWorkers, user, hasOwnToken }: Props) {
  const [cfToken, setCfToken] = useState('')
  const [cfAccountId, setCfAccountId] = useState('')
  const [cfSubdomain, setCfSubdomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTokenForm, setShowTokenForm] = useState(!hasOwnToken)
  const [deleting, setDeleting] = useState<string | null>(null)

  const allDeployments = [
    ...deployments.map(d => ({ ...d, source: 'apimcp' as const })),
    ...cfWorkers.map(w => ({ name: w.name, url: w.url, specUrl: '', createdAt: w.modified_on, toolsCount: 0, source: 'cloudflare' as const })),
  ]

  const saveToken = async () => {
    if (!cfToken || !cfAccountId) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloudflareToken: cfToken, accountId: cfAccountId, subdomain: cfSubdomain }),
      })
      if (res.ok) {
        setSaved(true)
        setShowTokenForm(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {}
    setSaving(false)
  }

  const deleteWorker = async (name: string) => {
    setDeleting(name)
    try {
      const res = await fetch('/api/delete-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) window.location.reload()
      else { const d = await res.json(); alert(d.error || 'Delete failed') }
    } catch { alert('Delete failed') }
    setDeleting(null)
  }

  const removeToken = async () => {
    await fetch('/api/settings', { method: 'DELETE' })
    setCfToken('')
    setCfAccountId('')
    setCfSubdomain('')
    setShowTokenForm(true)
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-light/30">
          <div>
            <Link href="/" className="font-mono text-xs text-blueprint tracking-[0.2em] hover:underline">← apimcp</Link>
            <h1 className="text-2xl font-bold font-mono text-text mt-2">My Servers</h1>
          </div>
          <div className="flex items-center gap-4">
            {user.image && <img src={user.image} alt="" className="w-7 h-7 rounded-full border border-border-light" />}
            <span className="font-mono text-xs text-text-dim hidden sm:inline">{user.name}</span>
            <button onClick={() => signOut()}
              className="font-mono text-xs text-text-dim/50 hover:text-stamp transition-colors">Exit</button>
          </div>
        </div>

        <div className="mb-8 p-4 border border-border-light/40 bg-surface-light"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-xs text-text-dim uppercase tracking-[0.15em]">Cloudflare Connection</h2>
            {hasOwnToken && (
              <button onClick={removeToken}
                className="font-mono text-[10px] text-stamp/60 hover:text-stamp transition-colors uppercase tracking-wider">
                Remove
              </button>
            )}
          </div>
          {showTokenForm ? (
            <div className="space-y-3">
              <div className="text-[11px] text-text-muted/60 font-sans">
                Connect your Cloudflare account to deploy workers under your own subdomain.
              </div>
              <input
                value={cfToken}
                onChange={e => setCfToken(e.target.value)}
                placeholder="CF_API_TOKEN"
                type="password"
                className="w-full bg-black/[0.2] border border-border-light/40 px-3 py-2 text-xs font-mono text-text outline-none focus:border-blueprint"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
              />
              <div className="flex gap-3">
                <input
                  value={cfAccountId}
                  onChange={e => setCfAccountId(e.target.value)}
                  placeholder="Account ID"
                  className="flex-1 bg-black/[0.2] border border-border-light/40 px-3 py-2 text-xs font-mono text-text outline-none focus:border-blueprint"
                  style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
                />
                <input
                  value={cfSubdomain}
                  onChange={e => setCfSubdomain(e.target.value)}
                  placeholder="Subdomain (optional)"
                  className="flex-1 bg-black/[0.2] border border-border-light/40 px-3 py-2 text-xs font-mono text-text outline-none focus:border-blueprint"
                  style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
                />
              </div>
              <button onClick={saveToken} disabled={saving}
                className="px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors disabled:opacity-40"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                {saving ? 'Saving...' : 'Connect'}
              </button>
              {saved && <span className="text-[10px] text-green-400/60 font-mono">● Connected</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-400/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </div>
          )}
        </div>

        <div className="space-y-2">
          {allDeployments.length === 0 ? (
            <div className="text-center py-16">
              <div className="font-mono text-sm text-text-dim/30 mb-3">{'[ no servers deployed ]'}</div>
              <Link href="/"
                className="font-mono text-xs text-blueprint hover:underline uppercase tracking-wider">
                Deploy your first API →
              </Link>
            </div>
          ) : (
            allDeployments.map((d, i) => (
              <div key={i}
                className="flex items-center gap-4 p-4 border border-border-light/30 bg-surface-light hover:border-border-light/60 transition-colors"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-text truncate">{d.name}</div>
                  <div className="font-mono text-[10px] text-text-dim/50 truncate mt-0.5">{d.url}</div>
                </div>
                <div className="hidden sm:block text-[10px] font-mono text-text-dim/40">
                  {d.toolsCount > 0 ? `${d.toolsCount} tools` : ''}
                </div>
                <div className="text-[10px] font-mono text-text-dim/30 w-20 text-right">
                  {d.createdAt?.slice(0, 10) || ''}
                </div>
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-mono text-blueprint hover:underline uppercase tracking-wider flex-shrink-0">
                  Open
                </a>
                <button onClick={() => deleteWorker(d.name)}
                  disabled={deleting === d.name}
                  className="text-[10px] font-mono text-stamp/60 hover:text-stamp transition-colors uppercase tracking-wider flex-shrink-0 disabled:opacity-30">
                  {deleting === d.name ? '...' : 'Delete'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
