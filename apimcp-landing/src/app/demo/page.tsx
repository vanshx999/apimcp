'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type ToolInfo = { name: string; description: string; inputSchema: { properties?: Record<string, any>; required?: string[] } }
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

  const [tools, setTools] = useState<ToolInfo[]>([])
  const [selectedTool, setSelectedTool] = useState<ToolInfo | null>(null)
  const [toolArgs, setToolArgs] = useState<string>('{}')
  const [toolResult, setToolResult] = useState<string>('')
  const [toolLoading, setToolLoading] = useState(false)

  const [tab, setTab] = useState<'chat' | 'tools'>('tools')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const serverParam = params.get('server')
    if (serverParam) {
      setServerUrl(serverParam)
      return
    }
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.deployments?.length > 0) setServerUrl(d.deployments[0].url)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!serverUrl) return
    fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }).then(r => r.json()).then(data => {
      if (data?.result?.tools) setTools(data.result.tools)
    }).catch(() => {})
  }, [serverUrl])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const callToolDirect = async () => {
    if (!selectedTool || !serverUrl) return
    setToolLoading(true)
    setToolResult('')
    let args: any = {}
    try { args = JSON.parse(toolArgs) } catch {}
    try {
      const res = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedTool.name, arguments: args }),
      })
      const text = await res.text()
      try { setToolResult(JSON.stringify(JSON.parse(text), null, 2)) } catch { setToolResult(text) }
    } catch (e: any) {
      setToolResult('Error: ' + e.message)
    } finally {
      setToolLoading(false)
    }
  }

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
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, toolCalls: data.toolCalls }])
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
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-4">MCP Test Lab</div>
          <h1 className="text-xl font-black uppercase tracking-tight mb-4">Sign in to test your server</h1>
          <p className="text-xs text-text-dim/70 mb-6">Deploy an API first, then test it here.</p>
          <a href="/" className="inline-block px-6 py-3 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
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
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-4">MCP Test Lab</div>
          <h1 className="text-xl font-black uppercase tracking-tight mb-4">No Server Selected</h1>
          <p className="text-xs text-text-dim/70 mb-6">Deploy an API first, then come back to test it.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/apis" className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
              style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>Registry</a>
            <a href="/" className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border border-stamp text-stamp hover:bg-stamp/10 transition-colors"
              style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>Deploy Your Own</a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper text-text font-mono">
      <div className="mx-auto max-w-4xl px-3 py-8 md:py-12">
        <div className="text-center mb-6">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-2">MCP Test Lab</div>
          <h1 className="text-xl font-black uppercase tracking-tight text-text">Test Your MCP Server</h1>
          <div className="mt-2 text-[10px] text-text-dim/50 truncate max-w-lg mx-auto">
            Server: <span className="text-text-dim/70">{serverUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-4 border-b border-border-light/40">
          <button onClick={() => setTab('tools')}
            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${tab === 'tools' ? 'text-blueprint border-b-2 border-blueprint' : 'text-text-dim/50 hover:text-text-dim/80'}`}>
            Tools
          </button>
          <button onClick={() => setTab('chat')}
            className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${tab === 'chat' ? 'text-blueprint border-b-2 border-blueprint' : 'text-text-dim/50 hover:text-text-dim/80'}`}>
            AI Chat
          </button>
        </div>

        {tab === 'tools' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-border-light bg-surface-light"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
              <div className="px-3 py-2 border-b border-border-light/40 text-[10px] font-semibold uppercase tracking-wider text-text-dim/60">
                Available Tools ({tools.length})
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {tools.map(t => (
                  <button key={t.name} onClick={() => { setSelectedTool(t); setToolArgs('{}'); setToolResult('') }}
                    className={`w-full text-left px-3 py-2 border-b border-border-light/10 text-[10px] hover:bg-blueprint/[0.04] transition-colors ${selectedTool?.name === t.name ? 'bg-blueprint/[0.08] border-l-2 border-l-blueprint' : ''}`}>
                    <div className="font-semibold text-text-dim/80">{t.name}</div>
                    <div className="text-text-dim/40 truncate mt-0.5">{t.description || 'No description'}</div>
                  </button>
                ))}
                {tools.length === 0 && (
                  <div className="px-3 py-6 text-[10px] text-text-dim/30 text-center">Loading tools...</div>
                )}
              </div>
            </div>

            <div className="border border-border-light bg-surface-light"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
              <div className="px-3 py-2 border-b border-border-light/40 text-[10px] font-semibold uppercase tracking-wider text-text-dim/60">
                {selectedTool ? selectedTool.name : 'Select a tool'}
              </div>
              {selectedTool && (
                <div className="p-3">
                  <div className="text-[10px] text-text-dim/60 mb-2">{selectedTool.description}</div>
                  <div className="text-[9px] text-text-dim/40 mb-1">Arguments (JSON):</div>
                  <textarea value={toolArgs} onChange={e => setToolArgs(e.target.value)}
                    className="w-full bg-black/[0.2] border border-border-light/30 px-2 py-1.5 text-[10px] font-mono text-text outline-none focus:border-blueprint/50 mb-2 resize-none"
                    rows={4}
                    style={{ clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)' }} />
                  <button onClick={callToolDirect} disabled={toolLoading}
                    className="w-full px-3 py-2 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors disabled:opacity-40 mb-2"
                    style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                    {toolLoading ? 'Calling...' : 'Call Tool'}
                  </button>
                  {toolResult && (
                    <div>
                      <div className="text-[9px] text-text-dim/40 mb-1">Result:</div>
                      <pre className="bg-black/[0.2] border border-border-light/30 p-2 text-[9px] font-mono text-text-dim/70 overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap"
                        style={{ clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)' }}>{toolResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <>
            <div className="border border-border-light bg-surface-light mb-4"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-text-dim/40">
                    <div className="text-[11px] mb-1">Ask the agent to do something with your API.</div>
                    <div className="text-[9px] text-text-dim/30">e.g. &ldquo;List repos&rdquo; or &ldquo;Find issues&rdquo;</div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 text-xs ${msg.role === 'user' ? 'bg-blueprint/20 text-text' : 'bg-surface-lighter/50 text-text-dim'}`}
                        style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                        <div className="text-[9px] text-text-dim/40 uppercase tracking-wider mb-1">{msg.role === 'user' ? 'You' : 'Agent'}</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                    </div>
                    {msg.toolCalls?.map((tc, j) => (
                      <div key={j} className="mt-1.5 ml-2 bg-blueprint/[0.06] border border-blueprint/20 text-[9px] p-2"
                        style={{ clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)' }}>
                        <span className="font-semibold text-blueprint/70 uppercase tracking-wider">Tool: {tc.name}</span>
                        {tc.args && Object.keys(tc.args).length > 0 && <div className="text-text-dim/40 mt-0.5 font-mono">Args: {JSON.stringify(tc.args)}</div>}
                        {tc.result && <div className="text-text-dim/40 mt-0.5 font-mono truncate">Result: {tc.result.slice(0, 200)}</div>}
                      </div>
                    ))}
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

            {error && <div className="mb-3 text-[10px] text-red-400/80 text-center">{error}</div>}

            <div className="flex items-center gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !loading) sendMessage() }}
                placeholder={loading ? 'Waiting...' : 'Ask the agent to do something...'}
                disabled={loading}
                className="flex-1 bg-surface-light border border-border-light px-3 py-2.5 text-xs font-mono text-text placeholder:text-text-dim/30 outline-none focus:border-blueprint/50 transition-colors disabled:opacity-40"
                style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }} />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors disabled:opacity-40"
                style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>Send</button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
