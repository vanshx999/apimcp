import { PRESTAMPED_APIS, CATEGORIES } from '@/lib/prestamped-apis'

export default function ApisPage() {
  return (
    <main className="min-h-screen bg-paper text-text font-mono">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-4">
            Registry
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-text">
            Pre-Stamped APIs
          </h1>
          <p className="mt-4 text-sm text-text-dim/70 max-w-lg mx-auto">
            One-click deploy popular APIs as MCP servers. No config. No CLI.
            Just pick an API and stamp it.
          </p>
        </div>

        {CATEGORIES.map(category => (
          <section key={category} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-px bg-stamp/40" />
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stamp/60">{category}</h2>
              <div className="flex-1 h-px bg-border-light/40" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESTAMPED_APIS.filter(a => a.category === category).map(api => (
                <a
                  key={api.id}
                  href={'/?url=' + encodeURIComponent(api.specUrl)}
                  className="group block relative border border-border-light bg-surface-light p-5 transition-all duration-200 hover:border-blueprint/40 hover:bg-blueprint/[0.03] hover:shadow-[0_0_0_1px_rgba(79,127,255,0.15)]"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
                >
                  {api.curated && (
                    <div className="absolute top-3 right-3 text-[8px] uppercase tracking-[0.15em] font-semibold bg-stamp/10 text-stamp/60 px-2 py-0.5"
                      style={{ clipPath: 'polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)' }}>
                      Curated
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl text-blueprint">{api.logo}</span>
                    <div>
                      <div className="text-sm font-semibold text-text group-hover:text-blueprint transition-colors">{api.name}</div>
                      <div className="text-[10px] text-text-dim/50 mt-0.5">{api.tools}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-dim/70 leading-relaxed">{api.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px]">
                    <span className="text-blueprint font-semibold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      Stamp & Deploy &rarr;
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-16 p-6 border border-border-light bg-surface-light text-center"
          style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
          <div className="text-[10px] text-text-dim/60 uppercase tracking-[0.2em] mb-2">Don&apos;t see your API?</div>
          <p className="text-xs text-text-dim/70 mb-4 max-w-md mx-auto">
            Any OpenAPI 3.0 or Swagger 2.0 spec works. Paste any spec URL on the homepage.
          </p>
          <a href="/"
            className="inline-block px-6 py-3 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            Deploy Your Own API
          </a>
        </div>
      </div>
    </main>
  )
}
