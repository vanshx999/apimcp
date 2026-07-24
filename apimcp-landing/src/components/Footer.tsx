'use client'

export default function Footer() {
  return (
    <footer className="relative mt-24 md:mt-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blueprint/[0.02] to-blueprint/[0.03] pointer-events-none" />

      <div className="border-t-2 border-border relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="font-mono text-xs text-text-dim tracking-[0.15em] uppercase">apimcp</div>
                <span className="text-border-light/50 text-xs">/</span>
                <div className="text-[10px] font-mono text-blueprint">{'<'}deploy{' />'}</div>
              </div>
              <p className="text-xs text-text-muted/60 leading-relaxed max-w-sm font-sans">
                Turn any HTTP API into an MCP server that AI agents can talk to.
                Open-source, built for YC S26.
              </p>
              <div className="flex gap-4 mt-5">
                <a href="https://github.com/vanshx999/apimcp" target="_blank" rel="noopener noreferrer"
                  className="group text-[11px] font-mono text-text-muted/50 hover:text-blueprint transition-colors">
                  <span className="underline underline-offset-4 decoration-1 decoration-border-light/50 group-hover:decoration-blueprint/50 transition-colors">GitHub</span>
                  <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <a href="https://apimcp-webapp.vanshmehndiratta13.workers.dev" target="_blank" rel="noopener noreferrer"
                  className="group text-[11px] font-mono text-text-muted/50 hover:text-blueprint transition-colors">
                  <span className="underline underline-offset-4 decoration-1 decoration-border-light/50 group-hover:decoration-blueprint/50 transition-colors">Webapp</span>
                  <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                <a href="https://x.com/vanshx999" target="_blank" rel="noopener noreferrer"
                  className="group text-[11px] font-mono text-text-muted/50 hover:text-blueprint transition-colors">
                  <span className="underline underline-offset-4 decoration-1 decoration-border-light/50 group-hover:decoration-blueprint/50 transition-colors">X</span>
                  <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] text-text-dim/40 uppercase tracking-[0.2em] mb-4">Stops</div>
              <div className="space-y-2.5">
                {['01 Spec In', '02 Stamped', '03 Agent Out'].map((s, i) => (
                  <div key={i} className="text-xs text-text-muted/50 hover:text-text transition-colors cursor-default">
                    <span className="text-[10px] text-text-dim/30 mr-2">—</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end justify-between">
              <div className="border-2 border-border-light px-5 py-4 transition-all duration-300 hover:border-stamp/30 hover:shadow-[0_0_15px_rgba(255,107,53,0.1)]"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
                <div className="text-[8px] font-mono text-stamp/60 uppercase tracking-[0.25em]">Inspected & Approved</div>
                <div className="font-mono text-sm font-bold text-text leading-tight mt-0.5">AGENT TRAVEL</div>
                <div className="text-[9px] font-mono text-text-dim/40 mt-1.5">Protocol 2025-11-25</div>
                <div className="text-[7px] font-mono text-text-dim/20 mt-1">{new Date().toISOString().slice(0, 10)}</div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-dashed border-border-light/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[9px] font-mono text-text-dim/30 tracking-wider uppercase">
              MIT License — Open Source — YC S26
            </div>
            <div className="text-[8px] font-mono text-text-dim/20 tracking-[0.3em] select-none">
              {Array.from({ length: 28 }, () => '█').join('')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
