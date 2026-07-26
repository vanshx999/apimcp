'use client'

import { useState, useEffect } from 'react'
import { load as parseYaml } from 'js-yaml'
import { curateEndpoints } from '@/lib/curate-tools'

type RawEndpoint = {
  method: string
  path: string
  toolName: string
  summary: string
  description: string
  parameters: { name: string; in: string; required: boolean; type: string; description: string }[]
  hasBody: boolean
  tags?: string[]
}

const GITHUB_SPEC = 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.17/ghes-3.17.json'

function resolveRef(ref: string, spec: any): any {
  const parts = ref.replace(/^#\//, '').split('/')
  let obj = spec
  for (const part of parts) {
    if (obj && typeof obj === 'object' && part in obj) obj = obj[part]
    else return null
  }
  return obj
}

function resolveSchema(schema: any, spec: any, seen?: Set<string>): any {
  if (!schema || typeof schema !== 'object') return schema
  if (schema.$ref) {
    const refPath = schema.$ref
    if (!seen) seen = new Set()
    if (seen.has(refPath)) return { type: 'string', description: '(circular ref)' }
    seen.add(refPath)
    const resolved = resolveRef(refPath, spec)
    return resolved ? resolveSchema(resolved, spec, seen) : schema
  }
  if (schema.items) schema.items = resolveSchema(schema.items, spec, seen)
  if (schema.properties) {
    for (const key of Object.keys(schema.properties))
      schema.properties[key] = resolveSchema(schema.properties[key], spec, seen)
  }
  if (schema.allOf) schema.allOf = schema.allOf.map((s: any) => resolveSchema(s, spec, seen))
  return schema
}

function resolveParams(params: any[], spec: any): any[] {
  return (params || []).map(p => {
    if (p.$ref) { const r = resolveRef(p.$ref, spec); return r || p }
    if (p.schema && p.schema.$ref) p.schema = resolveSchema(p.schema, spec)
    return p
  })
}

function resolveRequestBody(reqBody: any, spec: any): any {
  if (!reqBody) return null
  if (reqBody.$ref) return resolveRef(reqBody.$ref, spec) || reqBody
  if (reqBody.content) {
    for (const ct of Object.keys(reqBody.content)) {
      const mt = reqBody.content[ct]
      if (mt.schema) mt.schema = resolveSchema(mt.schema, spec)
    }
  }
  return reqBody
}

function rawParse(specData: any): { endpoints: RawEndpoint[]; name: string } {
  const paths = specData.paths || {}
  const endpoints: RawEndpoint[] = []
  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue
    const pathParams = (methods as any).parameters || []
    for (const [method, details] of Object.entries(methods as any)) {
      if (!details || typeof details !== 'object') continue
      if (method === 'parameters') continue
      const rawParams = [...pathParams, ...((details as any).parameters || [])]
      const params = resolveParams(rawParams, specData)
      const body = resolveRequestBody((details as any).requestBody, specData)
      endpoints.push({
        method: method.toUpperCase(),
        path,
        toolName: ((details as any).operationId || path).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '').substring(0, 64) || 'unnamed',
        summary: (details as any).summary || '',
        description: (details as any).description || '',
        hasBody: !!body,
        tags: (details as any).tags || [],
        parameters: params.map((p: any) => ({
          name: p.name,
          in: p.in || 'query',
          required: !!p.required,
          type: (p.schema?.type) || 'string',
          description: p.description || '',
        })),
      })
    }
  }
  return { endpoints, name: (specData.info || {}).title || 'Unknown API' }
}

export default function CurationDemo() {
  const [data, setData] = useState<{ raw: RawEndpoint[]; groups: ReturnType<typeof curateEndpoints>; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(GITHUB_SPEC, { headers: { 'User-Agent': 'apimcp-demo/1.0' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        let specData: any
        try { specData = JSON.parse(text) } catch { specData = parseYaml(text) }
        const { endpoints, name } = rawParse(specData)
        const groups = curateEndpoints(endpoints)
        setData({ raw: endpoints, groups, name })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-paper text-text font-mono flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-6 h-6 border-2 border-blueprint border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-[10px] text-text-dim uppercase tracking-wider">Fetching GitHub spec...</div>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-paper text-text font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-stamp text-sm mb-2">Failed to load spec</div>
          <div className="text-[10px] text-text-dim">{error}</div>
        </div>
      </main>
    )
  }

  const totalRaw = data.raw.length
  const totalCurated = data.groups.reduce((s, g) => s + g.endpoints.length, 0)
  const reduction = Math.round((1 - totalCurated / totalRaw) * 100)

  return (
    <main className="min-h-screen bg-paper text-text font-mono">
      <div className="mx-auto max-w-6xl px-3 py-12 md:py-20">
        <div className="text-center mb-8">
          <div className="text-[10px] text-blueprint/60 font-semibold uppercase tracking-[0.2em] mb-3">Curation Engine</div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-text">Before & After</h1>
          <p className="mt-3 text-xs text-text-dim/70 max-w-lg mx-auto">
            Most OpenAPI-to-MCP tools dump every endpoint as-is. apimcp curates them into tools an agent can actually use.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 md:gap-10 mb-10 px-4">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-red-400/80">{totalRaw}</div>
            <div className="text-[9px] text-text-dim/60 uppercase tracking-wider mt-1">Raw Endpoints</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 md:w-20 h-px bg-border-light/40" />
            <span className="text-lg font-black text-stamp">{reduction}%</span>
            <div className="w-12 md:w-20 h-px bg-border-light/40" />
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-green-400/80">{totalCurated}</div>
            <div className="text-[9px] text-text-dim/60 uppercase tracking-wider mt-1">Curated Tools</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-black text-blueprint/80">{data.groups.length}</div>
            <div className="text-[9px] text-text-dim/60 uppercase tracking-wider mt-1">Groups</div>
          </div>
        </div>

        <div className="text-[10px] text-text-dim/40 text-center mb-8">
          Data from <span className="text-text-dim/60">{data.name}</span> &mdash; <span className="text-text-dim/60">fetched live</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="border border-border-light bg-surface-light"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
            <div className="bg-red-400/10 px-4 py-3 border-b border-border-light/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400/60" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400/80">Raw Conversion</span>
                <span className="flex-1" />
                <span className="text-[9px] text-text-dim/40">{totalRaw} endpoints</span>
              </div>
              <div className="text-[9px] text-text-dim/50 mt-1.5 leading-relaxed">
                1:1 OpenAPI operation to MCP tool. Every endpoint, every parameter, raw <code className="text-text-dim/70">operationId</code> names.
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {data.raw.slice(0, 60).map((ep, i) => (
                <div key={i} className="px-4 py-2 border-b border-border-light/20 hover:bg-red-400/[0.02] text-[10px]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold w-12 uppercase ${methodColor(ep.method)}`}>{ep.method}</span>
                    <span className="text-text-dim/70 truncate">{ep.path}</span>
                  </div>
                  <div className="text-text-dim/40 truncate ml-14">{ep.toolName}</div>
                </div>
              ))}
              {data.raw.length > 60 && (
                <div className="px-4 py-3 text-[9px] text-text-dim/40 text-center">
                  Showing 60 of {totalRaw} raw endpoints
                </div>
              )}
            </div>
          </div>

          <div className="border border-border-light bg-surface-light"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}>
            <div className="bg-green-400/10 px-4 py-3 border-b border-border-light/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400/60" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-green-400/80">apimcp Curated</span>
                <span className="flex-1" />
                <span className="text-[9px] text-text-dim/40">{totalCurated} tools, {data.groups.length} groups</span>
              </div>
              <div className="text-[9px] text-text-dim/50 mt-1.5 leading-relaxed">
                Grouped by resource, filtered by relevance, named for LLM understanding.
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {data.groups.map((group) => (
                <div key={group.name}>
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border-light/20 hover:bg-green-400/[0.02] text-left transition-colors"
                  >
                    <span className={`text-[9px] font-bold transition-transform ${expandedGroup === group.name ? 'rotate-90' : ''}`}>
                      &rsaquo;
                    </span>
                    <span className="text-xs font-semibold text-green-300/70">{group.name}</span>
                    <span className="text-[9px] text-text-dim/40">{group.endpoints.length} tools</span>
                    <span className="flex-1" />
                    <span className="text-[9px] text-text-dim/30">{group.endpoints.length} operations</span>
                  </button>
                  {expandedGroup === group.name && (
                    <div className="bg-black/[0.15]">
                      {group.endpoints.map((ep, j) => (
                        <div key={j} className="px-7 py-2 border-b border-border-light/10 text-[10px]">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-bold w-12 uppercase ${methodColor(ep.method)}`}>{ep.method}</span>
                            <span className="text-text-dim/70 truncate">{ep.path}</span>
                          </div>
                          <div className="text-stamp/70 truncate ml-14">{ep.toolName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 border border-border-light bg-surface-light text-center"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
          <div className="text-[10px] text-text-dim/50 uppercase tracking-wider mb-2">Try it with any API</div>
          <a href="/?url=https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.17/ghes-3.17.json"
            className="inline-block px-6 py-2.5 text-[10px] font-semibold uppercase tracking-wider bg-blueprint text-paper hover:bg-blueprint/80 transition-colors"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            Deploy GitHub API &rarr;
          </a>
        </div>
      </div>
    </main>
  )
}

function methodColor(m: string): string {
  switch (m) {
    case 'GET': return 'text-green-400/70'
    case 'POST': return 'text-blue-400/70'
    case 'PUT': return 'text-orange-400/70'
    case 'PATCH': return 'text-yellow-400/70'
    case 'DELETE': return 'text-red-400/70'
    default: return 'text-text-dim/50'
  }
}
