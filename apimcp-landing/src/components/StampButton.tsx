'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { track } from '@vercel/analytics'
import Link from 'next/link'

type CuratedEndpoint = {
  method: string; path: string; toolName: string; summary: string; parameters: any[]; group: string
}
type CuratedGroup = {
  name: string; description: string; endpoints: CuratedEndpoint[]
}
type ParseResult = {
  name: string
  version: string
  serverUrl: string
  endpoints: CuratedEndpoint[]
  groups: CuratedGroup[]
}

export default function StampButton({ onStamp, prefillUrl }: { onStamp?: () => void; prefillUrl?: string }) {
  const { data: session } = useSession()
  const [url, setUrl] = useState(prefillUrl || '')
  const [state, setState] = useState<'idle' | 'parsing' | 'deploying' | 'done' | 'error' | 'needs-cf'>('idle')
  const [showStamp, setShowStamp] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [deployUrl, setDeployUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shaking, setShaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (session) {
      fetch('/api/settings').then(r => r.json()).then(d => {
        if (!d.configured) setState('needs-cf')
      }).catch(() => {})
    }
  }, [session])

  const handleStamp = async () => {
    if (!url.trim()) {
      inputRef.current?.focus()
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }
    if (!session) {
      signIn('github')
      return
    }
    const checkCf = await fetch('/api/settings')
    const cfData = await checkCf.json()
    if (!cfData.configured) {
      setState('needs-cf')
      return
    }
    setState('parsing')
    setErrorMsg('')
    track('Parse Spec', { url: url.trim() })
    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const parseData = await parseRes.json()
      if (!parseRes.ok) throw new Error(parseData.error || 'Parse failed')
      setResult(parseData)
      setState('deploying')
      track('Deploy Worker', { url: url.trim(), endpoints: parseData.endpoints?.length || 0 })
      const deployRes = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const deployData = await deployRes.json()
      if (!deployRes.ok) throw new Error(deployData.error || 'Deploy failed')
      setDeployUrl(deployData.url)
      track('Deploy Complete', { url: deployData.url })
      setState('done')
      setShowStamp(true)
      onStamp?.()
      setTimeout(() => setShowStamp(false), 4000)
    } catch (e: any) {
      track('Deploy Error', { error: e.message })
      setErrorMsg(e.message)
      setState('error')
    }
  }

  return (
    <div className="relative max-w-xl mx-auto">
      <div className={`
        relative border-2 border-border bg-surface-light p-6 md:p-8 font-mono text-sm
        transition-all duration-300 hover-glow
        ${shaking ? 'animate-[shake_0.5s_ease]' : ''}
        ${state === 'done' ? 'border-green-500/40' : ''}
      `}
        style={{
          boxShadow: '6px 6px 0 rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)',
          clipPath: 'polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px)',
        }}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23F0ECE1\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          backgroundSize: '30px 30px' }} />

        <div className="flex items-center gap-3 mb-5 text-xs text-text-muted">
          <span className="uppercase tracking-[0.15em] text-blueprint font-semibold text-[10px]">Form APIMCP-01</span>
          <span className="flex-1 border-t border-dashed border-border-light" />
          <span className="text-[10px] text-text-dim">Rev 2026</span>
        </div>

        <div className="mb-2 text-[10px] text-text-muted uppercase tracking-[0.15em] font-semibold">Declared API Specification</div>

        <div className="relative">
          <div className="flex items-center border-2 border-border-light bg-surface-lighter/50 transition-all duration-200 focus-within:border-blueprint focus-within:bg-blueprint/[0.04] focus-within:shadow-[0_0_0_3px_rgba(79,127,255,0.12)]"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
            <span className="pl-4 text-text-dim text-xs select-none">{'>'}_</span>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
              className="flex-1 bg-transparent px-2 py-3.5 text-sm font-mono text-text placeholder:text-text-dim/40 outline-none"
              disabled={state === 'parsing' || state === 'deploying' || state === 'done'}
            />
            {url && state === 'idle' && (
              <span className="pr-4 text-[10px] text-green-400/60 font-semibold uppercase tracking-wider">● Live</span>
            )}
          </div>
          {state === 'idle' && url && (
            <div className="mt-2.5 flex items-center gap-2.5 text-[10px] text-text-dim">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                Spec detected
              </span>
              <span className="w-px h-3 bg-border-light/50" />
              <span className="text-text-dim/70">{url.match(/\.(json|yaml|yml)$/i) ? 'JSON/YAML' : 'Auto-detect'}</span>
              <span className="w-px h-3 bg-border-light/50" />
              <span className="text-text-dim/70">{url.split('/').pop()?.substring(0, 20) || 'spec'}</span>
            </div>
          )}
        </div>

        {result && state !== 'idle' && result.groups && (
          <div className="mt-4 border border-border-light/60 bg-black/[0.15] text-xs font-mono"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            <div className="flex items-center gap-3 text-[10px] text-text-dim uppercase tracking-[0.15em] p-3 pb-0">
              <span className="text-blueprint font-semibold">{'>'}_ spec</span>
              <span className="flex-1 border-t border-dashed border-border-light/30" />
              <span className="text-text-dim/50">v{result.version}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 text-text-muted">
              <div>
                <span className="text-text-dim/50">Name</span>
                <div className="text-text truncate">{result.name}</div>
              </div>
              <div>
                <span className="text-text-dim/50">Tools</span>
                <div className="text-text">{result.endpoints.length} total</div>
              </div>
              <div className="col-span-2">
                <span className="text-text-dim/50">Server</span>
                <div className="text-text-dim/80 truncate">{result.serverUrl}</div>
              </div>
            </div>
            <div className="border-t border-border-light/30 px-3 py-2 space-y-1.5 max-h-28 overflow-y-auto">
              {result.groups.map(g => (
                <div key={g.name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-stamp/50 shrink-0" />
                  <span className="text-text-dim/70 font-semibold">{g.name.replace(/_/g, ' ')}</span>
                  <span className="text-text-dim/40">{g.endpoints.length} tools</span>
                  <span className="hidden md:inline text-text-dim/30 truncate">{g.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => { if (state === 'needs-cf') window.location.href = '/dashboard'; else handleStamp() }}
            disabled={state !== 'idle' && state !== 'needs-cf'}
            className="group relative px-8 py-3.5 font-semibold text-sm uppercase tracking-[0.15em] transition-all duration-200 disabled:opacity-40 overflow-hidden"
            style={{
              background: state === 'done' ? '#302C27' : state === 'needs-cf' ? '#FF6B35' : '#4F7FFF',
              color: '#F0ECE1',
              clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)',
            }}>
            <span className="relative z-10 flex items-center gap-2.5">
              {state === 'parsing' ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Parsing...
                </>
              ) : state === 'deploying' ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Deploying...
                </>
              ) : state === 'done' ? (
                <>
                  <span>●</span> APPROVED
                </>
              ) : state === 'needs-cf' ? (
                <>
                  <span className="animate-pulse">!</span>
                  Connect Cloudflare
                </>
              ) : (
                <>
                  <span className="text-stamp group-hover:animate-pulse">⬡</span>
                  Stamp & Deploy →
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-blueprint-glow opacity-0 group-hover:opacity-100 group-active:opacity-80 transition-all duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>

          <div className="flex-1 text-right">
            {state === 'idle' && (
              <div className="text-[10px] text-text-dim/50 uppercase tracking-wider">Awaiting clearance</div>
            )}
            {state === 'parsing' && (
              <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-wider animate-pulse">● Scanning spec</div>
            )}
            {state === 'deploying' && (
              <div className="text-[10px] text-stamp/60 font-semibold uppercase tracking-wider animate-pulse">● Stamping manifest</div>
            )}
            {state === 'done' && (
              <div className="text-[10px] text-green-400/60 font-semibold uppercase tracking-wider animate-pulse">● Cleared for travel</div>
            )}
            {state === 'error' && (
              <div className="text-[10px] text-red-400/60 font-semibold uppercase tracking-wider">● Rejected</div>
            )}
          </div>
        </div>

        {deployUrl && (
          <div className="mt-4 p-3 border border-green-500/30 bg-green-500/[0.05]"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            <div className="text-[10px] text-green-400/60 uppercase tracking-[0.15em] font-semibold mb-1.5">● Deployed</div>
            <div className="flex items-center gap-2 mb-2">
              <input
                readOnly
                value={deployUrl}
                className="flex-1 bg-black/[0.3] px-2 py-2 text-xs font-mono text-stamp outline-none border border-border-light/30"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(deployUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  const config = JSON.stringify({
                    name: (result?.name || 'apimcp-server').toLowerCase().replace(/\s+/g, '-'),
                    transport: 'streamable-http',
                    url: deployUrl,
                  }, null, 2)
                  navigator.clipboard.writeText(config)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex-1 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-blueprint/70 text-paper hover:bg-blueprint text-center transition-colors"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                Copy Claude Config
              </button>
              <a
                href={`https://www.anthropic.com/claude-connect`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-stamp text-paper hover:bg-stamp/80 text-center transition-colors"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                How to Connect &rarr;
              </a>
            </div>
            <div className="text-[10px] text-text-dim/40 text-center">
              Or manually paste this URL in your AI client's MCP settings
            </div>
          </div>
        )}

        {state === 'needs-cf' && (
          <div className="mt-4 p-4 border border-stamp/30 bg-stamp/[0.05] text-center"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            <div className="text-xs font-mono text-stamp/80 mb-2">
              Connect your Cloudflare account to deploy.
            </div>
            <Link href="/dashboard"
              className="inline-block px-5 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider bg-stamp text-paper hover:bg-stamp/80 transition-colors"
              style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
              Go to Dashboard →
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 text-[11px] text-red-400/80 font-mono text-center">
            {errorMsg}
          </div>
        )}

        {showStamp && <StampMark id={'MCP-' + Date.now().toString(36).toUpperCase()} />}
      </div>

      <div className="absolute -bottom-2 -right-2 w-full h-full bg-white/[0.03] -z-10"
        style={{ clipPath: 'polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px)' }} />
    </div>
  )
}

function StampMark({ id }: { id: string }) {
  return (
    <div className="absolute -bottom-4 right-8 animate-stamp-ink z-20 select-none pointer-events-none">
      <div className="relative">
        <div className="bg-stamp text-paper px-4 py-3 rotate-6 shadow-[4px_4px_0_rgba(0,0,0,0.15)]"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
          <div className="text-[8px] font-mono tracking-[0.2em] uppercase opacity-80 mb-0.5">INSPECTED</div>
          <div className="text-lg font-black uppercase leading-none tracking-tight">APPROVED</div>
          <div className="text-base font-black uppercase leading-tight tracking-tight">FOR AGENT</div>
          <div className="text-base font-black uppercase leading-tight tracking-tight mb-1">TRAVEL</div>
          <div className="flex items-center gap-2 text-[7px] font-mono opacity-70">
            <span>{id}</span>
            <span className="flex-1 border-t border-paper/30" />
            <span>{new Date().toISOString().slice(2, 10).replace(/-/g, '/')}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-stamp/30 blur-xl -z-10 scale-110" />
      </div>
    </div>
  )
}
