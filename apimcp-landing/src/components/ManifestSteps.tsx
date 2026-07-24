'use client'

import { useRef, useEffect, useState } from 'react'

const steps = [
  {
    num: '01',
    title: 'Spec In',
    desc: 'Drop any OpenAPI 2.0/3.0 spec — JSON or YAML. apimcp parses every endpoint, parameter, schema, and security scheme into a structured tool manifest.',
    detail: 'All 1,206 GitHub REST API endpoints parsed in &lt;2s.',
    gradient: 'from-blueprint/20 to-transparent',
    accent: '#1F3FE0',
  },
  {
    num: '02',
    title: 'Stamped for Travel',
    desc: 'Each endpoint becomes a named MCP tool with auto-generated descriptions and typed JSON Schema inputs. No decorators. No boilerplate.',
    detail: 'Zero config — your API contract is your server definition.',
    gradient: 'from-stamp/20 to-transparent',
    accent: '#FF5A1F',
  },
  {
    num: '03',
    title: 'Agent Out',
    desc: 'Your MCP server goes live on Cloudflare Workers in seconds. Claude Desktop connects via Custom Connector — no terminal, no config files.',
    detail: 'Full Streamable HTTP transport. Protocol 2025-11-25.',
    gradient: 'from-blueprint/20 to-transparent',
    accent: '#1F3FE0',
  },
]

export default function ManifestSteps() {
  const sectionRef = useRef<HTMLElement>(null!)
  const [activeStep, setActiveStep] = useState(-1)
  const [lineProgress, setLineProgress] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const stepEls = section.querySelectorAll('[data-step]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-step') || '0')
            if (idx >= activeStep) setActiveStep(idx)
          }
        })
      },
      { threshold: 0.4 }
    )
    stepEls.forEach((el) => observer.observe(el))

    const lineObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setLineProgress(1)
      },
      { threshold: 0.1 }
    )
    const lineTrigger = section.querySelector('.line-trigger')
    if (lineTrigger) lineObserver.observe(lineTrigger)

    return () => { observer.disconnect(); lineObserver.disconnect() }
  }, [])

  return (
    <section ref={sectionRef} className="relative py-32 md:py-40 px-6 overflow-hidden" id="manifest">
      <div className="absolute inset-0 bg-gradient-to-b from-blueprint/[0.03] via-transparent to-blueprint/[0.03] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-3 text-[10px] font-mono text-blueprint uppercase tracking-[0.25em] mb-5 bg-blueprint/[0.06] px-4 py-2"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blueprint animate-pulse" />
            The Manifest — Three Stamps
          </div>
          <h2 className="text-4xl md:text-6xl font-mono font-bold text-text leading-[1.05]">
            From spec to<br />
            <span className="text-stamp relative">
              agent-ready
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-stamp/50" />
            </span>
          </h2>
        </div>

        <div className="relative">
          <div className="line-trigger absolute left-8 md:left-1/2 top-8 bottom-8 w-0.5 -translate-x-1/2 hidden md:block">
            <div className="absolute inset-0 bg-border-light/40" />
            <div
              className="absolute inset-0 bg-blueprint transition-all duration-[2000ms] ease-out"
              style={{ height: `${lineProgress * 100}%` }}
            />
          </div>

          <div className="relative space-y-28 md:space-y-36">
            {steps.map((step, i) => {
              const isActive = i <= activeStep
              return (
                <div key={i} data-step={i}
                  className={`relative flex flex-col md:flex-row items-start gap-8 md:gap-16 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-8'}`}>
                  <div className="hidden md:flex w-1/2 justify-end">
                    {i % 2 === 0 && <StepCard step={step} isActive={isActive} idx={i} align="right" />}
                  </div>

                  <div className="relative z-20 flex-shrink-0 mx-auto md:mx-0">
                    <div className={`
                      relative w-14 h-14 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center
                      font-mono font-bold text-sm md:text-base
                      transition-all duration-500
                      ${isActive
                        ? 'bg-text border-text text-surface scale-110 shadow-[0_0_20px_rgba(240,236,225,0.1)]'
                        : 'bg-surface-light border-border-light/50 text-text-dim'
                      }
                    `}>
                      {step.num}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-2 border-blueprint/30 animate-ping" style={{ animationDuration: '3s' }} />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 md:hidden">
                    <StepCard step={step} isActive={isActive} idx={i} align="left" />
                  </div>

                  <div className="hidden md:flex w-1/2">
                    {i % 2 === 1 && <StepCard step={step} isActive={isActive} idx={i} align="left" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, isActive, idx, align }: {
  step: typeof steps[0]; isActive: boolean; idx: number; align: 'left' | 'right'
}) {
  const [revealed, setRevealed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    if (!isActive) return
    const t = setTimeout(() => setRevealed(true), idx * 200)
    return () => clearTimeout(t)
  }, [isActive, idx])

  return (
    <div ref={cardRef}
      className={`relative p-6 md:p-8 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{
        background: isActive ? 'rgba(37,34,30,0.6)' : 'transparent',
        borderLeft: isActive ? `2px solid ${step.accent}60` : '2px solid transparent',
        backdropFilter: isActive ? 'blur(12px)' : 'none',
      }}>
      <div className={`text-[10px] font-mono text-text-dim uppercase tracking-[0.2em] mb-2 ${align === 'right' ? 'text-right' : ''}`}>
        Stop {step.num}
      </div>
      <h3 className={`text-2xl md:text-3xl font-mono font-bold text-text mb-4 ${align === 'right' ? 'text-right' : ''}`}>
        {step.title}
      </h3>
      <p className={`text-sm text-text-muted/70 leading-relaxed mb-4 font-sans ${align === 'right' ? 'text-right' : ''}`}>
        {step.desc}
      </p>
      <div className={`inline-flex items-center gap-2 text-[11px] font-mono ${isActive ? 'text-blueprint' : 'text-text-dim/30'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {step.detail}
      </div>
    </div>
  )
}
