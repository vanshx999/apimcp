'use client'

import { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Lenis from '@studio-freight/lenis'
import StampButton from '@/components/StampButton'
import ManifestSteps from '@/components/ManifestSteps'
import ConfigStrip from '@/components/ConfigStrip'
import Footer from '@/components/Footer'
import type { Hero3DHandle } from '@/components/Hero3DScene'

const Hero3DScene = dynamic(() => import('@/components/Hero3DScene'), { ssr: false })

export default function Home() {
  const heroRef = useRef<Hero3DHandle>(null!)
  const containerRef = useRef<HTMLDivElement>(null!)
  const [passport, setPassport] = useState('')

  useEffect(() => {
    setPassport(Date.now().toString(36).slice(-4).toUpperCase())
  }, [])

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1 - Math.pow(1 - t, 3)) })
    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  const handleStamp = () => {
    heroRef.current?.triggerStamp()
  }

  return (
    <main ref={containerRef} className="min-h-screen bg-surface overflow-hidden">
      <section className="relative min-h-screen flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-start justify-between">
          <div className="font-mono text-xs text-text-dim tracking-[0.2em]">
            <span className="text-blueprint font-semibold">apimcp</span>
            <span className="mx-2 text-text-dim/30">/</span>
            PASSPORT NO. MCP-2026-{passport || 'XXXX'}
          </div>
          <a href="https://github.com/vanshx999/apimcp" target="_blank" rel="noopener noreferrer"
            className="font-mono text-xs text-text-dim hover:text-blueprint transition-colors underline underline-offset-4 decoration-1 decoration-border-light">
            GitHub →
          </a>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">
          <div className="max-w-3xl mx-auto text-center mb-6 md:mb-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-mono font-bold text-text leading-[1.05] tracking-tight">
              Turn any API into<br />
              <span className="text-blueprint relative">
                an AI agent
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-stamp/40" />
              </span>
            </h1>
            <p className="mt-5 text-sm md:text-base text-text-muted/80 font-sans max-w-lg mx-auto leading-relaxed">
              Drop an OpenAPI spec. Get a live MCP server on Cloudflare.
              Claude Desktop connects directly — no terminal, no setup.
            </p>
          </div>

          <div className="w-full max-w-xl mb-6">
            <StampButton onStamp={handleStamp} />
          </div>

          <div className="h-4" />

          <div className="flex items-center gap-6 text-xs font-mono text-text-dim">
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

        <div className="absolute inset-0 top-0 z-0 opacity-80">
          <Hero3DScene ref={heroRef} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent z-10" />
      </section>

      <ManifestSteps />
      <ConfigStrip />
      <Footer />
    </main>
  )
}
