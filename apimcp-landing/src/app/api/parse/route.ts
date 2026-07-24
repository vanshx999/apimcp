import { NextResponse } from 'next/server'
import { load as parseYaml } from 'js-yaml'
import { checkParseRateLimit } from '@/lib/rate-limit'

function resolveRef(ref: string, spec: any): any {
  const parts = ref.replace(/^#\//, '').split('/')
  let obj = spec
  for (const part of parts) {
    if (obj && typeof obj === 'object' && part in obj) {
      obj = obj[part]
    } else {
      return null
    }
  }
  return obj
}

function resolveSchema(schema: any, spec: any): any {
  if (!schema || typeof schema !== 'object') return schema
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec)
    return resolved ? resolveSchema(resolved, spec) : schema
  }
  if (schema.items) schema.items = resolveSchema(schema.items, spec)
  if (schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      schema.properties[key] = resolveSchema(schema.properties[key], spec)
    }
  }
  if (schema.allOf) {
    schema.allOf = schema.allOf.map((s: any) => resolveSchema(s, spec))
  }
  return schema
}

function resolveParams(params: any[], spec: any): any[] {
  return (params || []).map(p => {
    if (p.$ref) {
      const resolved = resolveRef(p.$ref, spec)
      return resolved || p
    }
    if (p.schema && p.schema.$ref) {
      p.schema = resolveSchema(p.schema, spec)
    }
    return p
  })
}

function resolveRequestBody(reqBody: any, spec: any): any {
  if (!reqBody) return null
  if (reqBody.$ref) return resolveRef(reqBody.$ref, spec) || reqBody
  if (reqBody.content) {
    for (const ct of Object.keys(reqBody.content)) {
      const mediaType = reqBody.content[ct]
      if (mediaType.schema) {
        mediaType.schema = resolveSchema(mediaType.schema, spec)
      }
    }
  }
  return reqBody
}

function parseOpenAPISimple(specData: any) {
  const info = specData.info || {}
  const isSwagger2 = !specData.openapi && specData.swagger === '2.0'
  const paths = specData.paths || {}

  let serverUrl: string
  if (isSwagger2) {
    const scheme = (specData.schemes || ['https'])[0]
    const host = specData.host || 'unknown'
    const basePath = specData.basePath || ''
    serverUrl = scheme + '://' + host + basePath
  } else {
    serverUrl = ((specData.servers || [])[0] || {}).url || 'https://unknown'
  }

  const schemas = isSwagger2 ? (specData.definitions || {}) : ((specData.components || {}).schemas || {})
  const mergedSpec = isSwagger2 ? { ...specData, components: { schemas } } : { ...specData, components: { ...specData.components, schemas } }

  const endpoints: any[] = []

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue
    const pathParams = (methods as any).parameters || []
    for (const [method, details] of Object.entries(methods as any)) {
      if (!details || typeof details !== 'object') continue
      if (method === 'parameters') continue

      const rawParams = [...pathParams, ...((details as any).parameters || [])]
      const params = resolveParams(rawParams, mergedSpec)
      const body = resolveRequestBody((details as any).requestBody, mergedSpec)

      endpoints.push({
        method: method.toUpperCase(),
        path,
        toolName: ((details as any).operationId || path).replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '').substring(0, 64) || 'unnamed',
        summary: (details as any).summary || '',
        description: (details as any).description || '',
        hasBody: !!body,
        parameters: params.map((p: any) => ({
          name: p.name,
          in: p.in || 'query',
          required: !!p.required,
          type: (p.schema && p.schema.type) || 'string',
          description: p.description || '',
        })),
      })
    }
  }

  return {
    name: info.title || 'Unknown API',
    version: info.version || '1.0.0',
    serverUrl,
    endpoints,
  }
}

export async function POST(request: Request) {
  const rate = await checkParseRateLimit()
  if (!rate.allowed) {
    return NextResponse.json({
      error: `Rate limit exceeded. Try again in ${Math.ceil(rate.resetIn / 60000)} minutes.`,
    }, {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(rate.resetIn / 1000)),
      },
    })
  }
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'apimcp-parser/1.0' },
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch spec: ${res.status}` }, { status: 400 })
    }

    const text = await res.text()
    let specData: any
    try {
      specData = JSON.parse(text)
    } catch {
      try {
        specData = parseYaml(text)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON or YAML' }, { status: 400 })
      }
    }

    const parsed = parseOpenAPISimple(specData)
    return NextResponse.json(parsed)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
