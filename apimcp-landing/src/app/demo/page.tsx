'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type Message = { role: 'user' | 'assistant'; content: string; toolCalls?: ToolCallDisplay[] }
type ToolCallDisplay = { name: string; args: any; result?: string }

export default function DemoPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.deployments?.length > 0) {
        setServerUrl(d.deployments[0].url)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !serverUrl) return
    setLoading(true)
    setError('')
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')

    try {
      const res = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          serverUrl,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        toolCalls: data.toolCalls,
      }])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-paper text-text font-mono flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-4">Live Demo</div>
          <h1 className="text-xl font-black uppercase tracking-tight mb-4">Sign in to try the demo</h1>
          <p className="text-xs text-text-dim/70 mb-6">
            You need to deploy an API first. Sign in, paste an OpenAPI spec, and come back here.
          </p>
          <a href="/"
            className="inline-block px-6 py-3 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            Deploy an API first
          </a>
        </div>
      </main>
    )
  }

  if (!serverUrl) {
    return (
      <main className="min-h-screen bg-paper text-text font-mono flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-4">Live Demo</div>
          <h1 className="text-xl font-black uppercase tracking-tight mb-4">No Deployed Servers</h1>
          <p className="text-xs text-text-dim/70 mb-6">
            Deploy an API first from the registry or homepage, then come back to test it live.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/apis"
              className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
              style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
              Registry
            </a>
            <a href="/"
              className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border border-stamp text-stamp hover:bg-stamp/10 transition-colors"
              style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
              Deploy Your Own
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper text-text font-mono">
      <div className="mx-auto max-w-3xl px-3 py-8 md:py-12">
        <div className="text-center mb-6">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-2">Live Demo</div>
          <h1 className="text-xl font-black uppercase tracking-tight text-text">Test Your MCP Server</h1>
          <div className="mt-2 text-[10px] text-text-dim/50 truncate max-w-md mx-auto">
            Server: <span className="text-text-dim/70">{serverUrl}</span>
          </div>
        </div>

        <div className="border border-border-light bg-surface-light mb-4"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center py-8 text-text-dim/40">
                <div className="text-[11px] mb-1">
                  Ask the agent to do something with your API.
                </div>
                <div className="text-[9px] text-text-dim/30">
                  e.g. &ldquo;List all repos&rdquo; or &ldquo;Search for open issues&rdquo;
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 text-xs ${msg.role === 'user' ? 'bg-blueprint/20 text-text' : 'bg-surface-lighter/50 text-text-dim'}`}
                    style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                    <div className="text-[9px] text-text-dim/40 uppercase tracking-wider mb-1">
                      {msg.role === 'user' ? 'You' : 'Agent'}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-1.5 ml-2 space-y-1">
                    {msg.toolCalls.map((tc, j) => (
                      <div key={j} className="bg-blueprint/[0.06] border border-blueprint/20 text-[9px] p-2"
                        style={{ clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blueprint/60 shrink-0" />
                          <span className="font-semibold text-blueprint/70 uppercase tracking-wider">Tool: {tc.name}</span>
                        </div>
                        {tc.args && Object.keys(tc.args).length > 0 && (
                          <div className="text-text-dim/40 ml-3.5 mb-0.5 font-mono">
                            Args: {JSON.stringify(tc.args)}
                          </div>
                        )}
                        {tc.result && (
                          <div className="text-text-dim/40 ml-3.5 font-mono truncate max-w-full">
                            Result: {tc.result.slice(0, 200)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="text-xs text-text-dim flex items-center gap-2 px-3 py-2">
                  <span className="inline-block w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                  Agent thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {error && (
          <div className="mb-3 text-[10px] text-red-400/80 text-center">{error}</div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage() }}
            placeholder={loading ? 'Waiting for response...' : 'Ask the agent to do something...'}
            disabled={loading}
            className="flex-1 bg-surface-light border border-border-light px-3 py-2.5 text-xs font-mono text-text placeholder:text-text-dim/30 outline-none focus:border-blueprint/50 transition-colors disabled:opacity-40"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors disabled:opacity-40"
            style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
            Send
          </button>
        </div>
      </div>
    </main>
  )
}
