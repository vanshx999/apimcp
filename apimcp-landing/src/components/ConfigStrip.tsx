'use client'

import { useRef, useEffect, useState } from 'react'

export default function ConfigStrip() {
  const [visible, setVisible] = useState(false)
  const [pnr, setPnr] = useState('')
  const [barWidths, setBarWidths] = useState<number[]>([])
  const ref = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    setPnr(Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join(''))
    setBarWidths(Array.from({ length: 12 }, () => 20 + Math.random() * 60))
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const [codeRevealed, setCodeRevealed] = useState(false)
  useEffect(() => { if (visible) setTimeout(() => setCodeRevealed(true), 600) }, [visible])

  return (
    <section className="relative py-28 md:py-36 px-6 overflow-hidden" id="config">
      <div className="absolute inset-0 bg-gradient-to-b from-blueprint/[0.02] via-transparent to-blueprint/[0.02] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div ref={ref} className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 text-[10px] font-mono text-stamp uppercase tracking-[0.25em] mb-4 bg-stamp/[0.06] px-4 py-2"
              style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-stamp animate-pulse" />
              Boarding Pass — MCP-2026
            </div>
            <p className="text-xs font-mono text-ink/25 tracking-wider">Present this to Claude Desktop at the gate</p>
          </div>

          <div className="relative bg-surface-light border-2 border-border overflow-hidden transition-all duration-500 hover:shadow-[8px_8px_0_rgba(0,0,0,0.2)]"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23F0ECE1\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0v40M0 20h40\' stroke=\'%23F0ECE1\' stroke-width=\'0.5\'/%3E%3C/g%3E%3C/svg%3E")',
              backgroundSize: '40px 40px' }} />

            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-dashed border-border-light">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dashed border-border-light/60">
                  <div className="font-mono text-[10px] text-text-dim tracking-[0.15em] uppercase">Issued by</div>
                  <div className="font-mono text-sm font-bold text-text">apimcp</div>
                  <div className="w-px h-4 bg-border-light/50" />
                  <div className="text-[10px] text-blueprint font-mono">{'<deploy/>'}</div>
                  <div className="flex-1" />
                  <div className="font-mono text-[10px] text-text-dim/30 tracking-[0.25em]">CLS-01</div>
                </div>

                {codeRevealed && <CodeBlock />}
                {!codeRevealed && (
                  <div className="space-y-3 animate-pulse">
                    {[1,2,3,4,5,6,7].map(i => (
                      <div key={i} className="h-3 bg-white/5" style={{ width: `${40 + Math.random() * 50}%` }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-48 p-6 md:p-8 flex flex-row md:flex-col items-center justify-center gap-6 bg-black/[0.15] border-t md:border-t-0 md:border-l border-dashed border-border-light">
                <div className="w-24 md:w-full space-y-1.5">
                  <div className="text-[8px] font-mono text-text-dim/40 tracking-widest mb-2 text-center uppercase">Barcode</div>
                  {barWidths.map((w, i) => (
                    <div key={i} className="h-[5px] bg-text-dim/20" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-mono text-text-dim/40 tracking-[0.25em] mb-1">PNR</div>
                  <div className="font-mono text-sm font-bold text-text tracking-[0.15em]">{pnr}</div>
                  <div className="text-[9px] font-mono text-text-dim/40 mt-2 tracking-wider">
                    {new Date().toISOString().slice(0, 10).replace(/-/g, '/')}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-border-light/60 relative">
              <div className="absolute -top-[10px] -left-[10px] w-5 h-5 rounded-full bg-surface-light border-2 border-border-light/60" />
              <div className="absolute -top-[10px] -right-[10px] w-5 h-5 rounded-full bg-surface-light border-2 border-border-light/60" />
              <div className="flex items-center gap-3 px-6 py-3 text-[10px] font-mono text-text-dim/40">
                <span className="tracking-[0.2em] uppercase">Detach here</span>
                <span className="flex-1 border-t border-dashed border-border-light/30" />
                <span className="tracking-[0.3em] text-text-dim/20">
                  {Array.from({length: 16}, () => Math.random() > 0.5 ? '1' : '0').join(' ')}
                </span>
                <span className="text-text-dim/20">{new Date().toISOString().slice(0, 10)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] font-mono text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Streamable HTTP
            </span>
            <span className="text-border-light/50">|</span>
            <span>Protocol 2025-11-25</span>
            <span className="text-border-light/50">|</span>
            <span className="text-blueprint">v1.0.0</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function CodeBlock() {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { setTimeout(() => setRevealed(true), 300) }, [])

  const lines = [
    { text: '{', delay: 0, dim: false },
    { text: '  "mcpServers": {', delay: 120, dim: false },
    { text: '    "my-api": {', delay: 240, dim: false },
    { text: '      "url": "https://my-api.mcp.dev"', delay: 360, highlight: true, dim: false },
    { text: '    }', delay: 480, dim: false },
    { text: '  }', delay: 600, dim: false },
    { text: '}', delay: 720, dim: false },
  ]

  return (
    <div className="font-mono text-xs md:text-sm leading-relaxed">
      <div className="flex items-center gap-3 mb-4 text-[10px] text-text-dim uppercase tracking-[0.15em]">
        <span className="text-blueprint font-semibold">claude_desktop_config.json</span>
        <span className="flex-1 border-t border-dashed border-border-light/30" />
        <span className="text-text-dim/40">MCP Config</span>
      </div>
      {lines.map((line, i) => (
        <div key={i}
          className={`transition-all duration-500 ${revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
          style={{ transitionDelay: `${line.delay}ms` }}>
          <span className={`${line.highlight ? 'text-stamp font-semibold' : line.dim ? 'text-text-dim/50' : 'text-text-muted/80'}`}>
            {line.text}
          </span>
        </div>
      ))}

      <div className="mt-6 pt-5 border-t border-dashed border-border-light/40">
        <div className="flex items-center gap-2 mb-3 text-[10px] text-text-dim uppercase tracking-[0.15em]">
          <span className="w-1.5 h-1.5 rounded-full bg-text-dim/30" />
          Example Tool Call
        </div>
        <div className="bg-black/[0.2] p-4 text-[11px] leading-relaxed font-mono"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
          <div className="text-text-muted/60">
            <span className="text-blueprint">curl</span> -X POST <span className="text-stamp">$URL</span> \<br />
            <span className="pl-6">-H <span className="text-stamp/70">&quot;Content-Type: application/json&quot;</span> \</span><br />
            <span className="pl-6">-d <span className="text-stamp/70">&apos;</span>{'{'}</span><br />
            <span className="pl-8 text-text-dim/60">&quot;jsonrpc&quot;: &quot;2.0&quot;,</span><br />
            <span className="pl-8 text-text-dim/60">&quot;method&quot;: &quot;tools/call&quot;,</span><br />
            <span className="pl-8 text-text-dim/60">&quot;params&quot;: {'{'}</span><br />
            <span className="pl-10 text-text-dim/60">&quot;name&quot;: &quot;listRepos&quot;</span><br />
            <span className="pl-8 text-text-dim/60">{'}'}</span><br />
            <span className="pl-6">{'}'}<span className="text-stamp/70">&apos;</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
