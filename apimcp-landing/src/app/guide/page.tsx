import Link from 'next/link'

const steps = [
  {
    num: '01',
    title: 'Go to Cloudflare Dashboard',
    desc: 'Open https://dash.cloudflare.com/ and sign in to your account.',
    detail: 'If you don\'t have one, create a free Cloudflare account — it takes 2 minutes.',
  },
  {
    num: '02',
    title: 'Find Your Account ID',
    desc: 'On the right sidebar of your dashboard, you\'ll see "Account ID" under the API section. Copy it.',
    detail: 'It looks like: bf637b5491b28e1fcf9c25e5d435e928',
  },
  {
    num: '03',
    title: 'Create an API Token',
    desc: 'Go to My Profile → API Tokens → Create Token. Use the "Edit Cloudflare Workers" template.',
    detail: 'Permissions needed: Workers Scripts → Edit. Scope: your account.',
  },
  {
    num: '04',
    title: 'Copy Your Subdomain',
    desc: 'Go to Workers & Pages → Your subdomain. It\'s usually your-name.workers.dev.',
    detail: 'You\'ll see it at the top: "Your subdomain is xyz.workers.dev".',
  },
  {
    num: '05',
    title: 'Paste Into apimcp',
    desc: 'Go to Dashboard → Cloudflare Connection. Paste your API Token, Account ID, and Subdomain.',
    detail: 'Your credentials are encrypted and stored only in your browser session.',
  },
  {
    num: '06',
    title: 'Deploy Your First API',
    desc: 'Go back to the home page. Paste an OpenAPI URL. Click "Stamp & Deploy".',
    detail: 'Your MCP server will be live on your own workers.dev subdomain in seconds.',
  },
]

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-12">
          <Link href="/" className="font-mono text-xs text-blueprint hover:underline tracking-[0.2em]">← apimcp</Link>
          <h1 className="text-3xl md:text-5xl font-mono font-bold text-text mt-4 leading-tight">
            Connect your<br/>
            <span className="text-blueprint">Cloudflare</span> account
          </h1>
          <p className="mt-4 text-sm text-text-muted/70 font-sans max-w-lg leading-relaxed">
            5 minutes. No terminal. No credit card. You just need a Cloudflare account to deploy your own MCP servers.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-border-light/30 hidden sm:block" />

          <div className="relative space-y-10">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-start gap-6 sm:gap-8">
                <div className="relative z-10 flex-shrink-0 w-16 h-16 sm:w-14 sm:h-14 rounded-full border-2 border-blueprint/40 bg-surface-light flex items-center justify-center font-mono font-bold text-sm text-blueprint">
                  {step.num}
                  <div className="absolute inset-0 rounded-full border border-blueprint/20 animate-ping" style={{ animationDuration: '4s', animationDelay: `${i * 0.5}s` }} />
                </div>
                <div className="flex-1 pt-2 sm:pt-3">
                  <h2 className="font-mono text-lg sm:text-xl font-bold text-text mb-2">{step.title}</h2>
                  <p className="text-sm text-text-muted/70 font-sans leading-relaxed mb-2">{step.desc}</p>
                  <div className="inline-flex items-center gap-2 text-[11px] font-mono text-blueprint/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blueprint" />
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 p-6 border border-blueprint/20 bg-blueprint/[0.04] text-center"
          style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
          <p className="text-sm font-mono text-text-muted/80 mb-4">
            Got your credentials? Head to the dashboard.
          </p>
          <Link href="/dashboard"
            className="inline-block px-8 py-3 font-mono font-semibold text-sm uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
            Open Dashboard →
          </Link>
        </div>
      </div>
    </main>
  )
}
