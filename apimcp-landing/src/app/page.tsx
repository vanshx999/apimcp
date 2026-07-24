'use client'

import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import StampButton from '@/components/StampButton'
import ManifestSteps from '@/components/ManifestSteps'
import ConfigStrip from '@/components/ConfigStrip'
import Footer from '@/components/Footer'
import type { Hero3DHandle } from '@/components/Hero3DScene'

const Hero3DScene = dynamic(() => import('@/components/Hero3DScene'), { ssr: false })

export default function Home() {
  const { data: session } = useSession()
  const [prefillUrl, setPrefillUrl] = useState('')
  const heroRef = useRef<Hero3DHandle>(null!)
  const glowRef = useRef<HTMLDivElement>(null!)
  const [passport, setPassport] = useState('XXXX')

  useEffect(() => {
    setPassport(Date.now().toString(36).slice(-4).toUpperCase())
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('url')
    if (urlParam) setPrefillUrl(urlParam)
  }, [])

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return
    let rafId: number
    let mouseX = -400
    let mouseY = -400
    let currentX = -400
    let currentY = -400

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      glow.classList.add('visible')
    }
    const onLeave = () => glow.classList.remove('visible')

    const animate = () => {
      currentX += (mouseX - currentX) * 0.08
      currentY += (mouseY - currentY) * 0.08
      glow.style.left = currentX + 'px'
      glow.style.top = currentY + 'px'
      rafId = requestAnimationFrame(animate)
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMouse)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const handleStamp = () => {
    heroRef.current?.triggerStamp()
  }

  return (
    <main className="min-h-screen bg-surface overflow-hidden">
      <div ref={glowRef} className="cursor-glow" />

      <section className="relative min-h-screen flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-start justify-between">
          <div className="font-mono text-xs text-text-dim tracking-[0.2em]">
            <span className="text-blueprint font-semibold">apimcp</span>
            <span className="mx-2 text-text-dim/30">/</span>
            PASSPORT NO. MCP-2026-{passport || 'XXXX'}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img src={session.user.image} alt="" className="w-6 h-6 rounded-full border border-border-light" />
                )}
                <Link href="/dashboard"
                  className="font-mono text-[10px] text-blueprint hover:text-blueprint/80 transition-colors uppercase tracking-wider">
                  Dashboard
                </Link>
                <span className="font-mono text-[10px] text-text-dim hidden sm:inline">{session.user?.name}</span>
                <button onClick={() => signOut()}
                  className="font-mono text-[10px] text-text-dim/50 hover:text-stamp transition-colors uppercase tracking-wider">
                  Exit
                </button>
              </div>
            ) : (
              <button onClick={() => signIn('github')}
                className="font-mono text-[10px] text-text-dim hover:text-blueprint transition-colors uppercase tracking-wider">
                Sign In
              </button>
            )}
            <span className="w-px h-3 bg-border-light/30" />
            <Link href="/apis"
              className="font-mono text-[10px] text-text-dim hover:text-blueprint transition-colors">
              Registry
            </Link>
            <span className="w-px h-3 bg-border-light/30" />
            <Link href="/guide"
              className="font-mono text-[10px] text-text-dim hover:text-blueprint transition-colors">
              Guide
            </Link>
            <span className="w-px h-3 bg-border-light/30" />
            <a href="https://github.com/vanshx999/apimcp" target="_blank" rel="noopener noreferrer"
              className="font-mono text-[10px] text-text-dim hover:text-blueprint transition-colors">
              GitHub
            </a>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center px-6">
          <div className="max-w-2xl mx-auto lg:mx-0 lg:mr-auto lg:pl-8 xl:pl-16 py-20">
            <div className="mb-6 md:mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-mono font-bold text-text leading-[1.05] tracking-tight">
                Turn any API into<br />
                <span className="text-blueprint relative">
                  an AI agent
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-stamp/40" />
                </span>
              </h1>
              <p className="mt-5 text-sm md:text-base text-text-muted/80 font-sans max-w-lg leading-relaxed">
                Paste any OpenAPI spec. Get a live MCP server on <span className="text-blueprint">your</span> Cloudflare.
                FastMCP is a CLI. apimcp is a webapp. No terminal. No Docker. No DevOps.
              </p>
            </div>

            <div className="max-w-xl">
              <StampButton onStamp={handleStamp} prefillUrl={prefillUrl} />
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs font-mono text-text-dim">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                OpenAPI 2.0 / 3.0
              </span>
              <span className="w-px h-3 bg-border-light/50" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blueprint" />
                Streamable HTTP
              </span>
              <span className="w-px h-3 bg-border-light/50" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stamp" />
                Cloudflare Workers
              </span>
            </div>
          </div>

          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[45%] z-0 opacity-60">
            <Hero3DScene ref={heroRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent z-10" />
      </section>

      <ManifestSteps />
      <ConfigStrip />
      <Footer />
    </main>
  )
}
