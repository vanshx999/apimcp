import { NextResponse } from 'next/server'
import { load as parseYaml } from 'js-yaml'
import { auth } from '@/auth'

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

function generateWorkerCode(parsed: any, specUrl: string): string {
  const endpoints = parsed.endpoints.map((ep: any) => ({
    name: ep.toolName,
    method: ep.method,
    path: ep.path,
    summary: ep.summary || '',
    params: ep.parameters.filter((p: any) => p.in !== 'header').map((p: any) => ({ name: p.name, required: p.required, type: p.type, description: p.description })),
    hasBody: ep.hasBody,
  }))

  let serverUrl = parsed.serverUrl
  if (serverUrl && !serverUrl.startsWith('http')) {
    try {
      const u = new URL(specUrl)
      serverUrl = u.protocol + '//' + u.host + (serverUrl.startsWith('/') ? '' : '/') + serverUrl
    } catch {}
  }

  return `
const TOOLS = ${JSON.stringify(endpoints, null, 2)};

function url(path) { return ${JSON.stringify(serverUrl)}.replace(/\\/+$/, '') + path; }

async function callTool(name, args) {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) return { status: 400, body: JSON.stringify({ error: 'Unknown tool: ' + name }) };
  let path = tool.path;
  const query = new URLSearchParams();
  let body;
  for (const k of Object.keys(args || {})) {
    if (path.includes('{' + k + '}')) path = path.replace('{' + k + '}', encodeURIComponent(String(args[k])));
    else if (k === 'body') body = typeof args.body === 'string' ? args.body : JSON.stringify(args.body);
    else query.set(k, String(args[k]));
  }
  try {
    const res = await fetch(url(path) + (query.toString() ? '?' + query.toString() : ''), {
      method: tool.method, headers: { 'Content-Type': 'application/json', 'User-Agent': 'apimcp-worker/1.0' },
      body: tool.method !== 'GET' ? body : undefined,
    });
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: 500, body: JSON.stringify({ error: e.message }) };
  }
}

function mcpTool(t) {
  const props = {};
  for (const p of (t.params || [])) {
    props[p.name] = { type: p.type === 'integer' ? 'number' : (p.type || 'string'), description: p.description || '' };
  }
  const desc = t.summary || t.description || t.method + ' ' + t.path;
  return { name: t.name, description: desc, inputSchema: { type: 'object', properties: props, required: (t.params || []).filter(p => p.required).map(p => p.name) } };
}

function rpc(id, result, err) {
  const body = { jsonrpc: '2.0', id: id !== undefined ? id : null };
  if (err) body.error = { code: -32603, message: err };
  else body.result = result;
  return body;
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleMCP(req) {
  const { id, method, params } = req;
  if (method === 'initialize') return jsonResp(rpc(id, { protocolVersion: '2025-11-25', capabilities: { tools: {} }, serverInfo: { name: 'apimcp', version: '1.0.0' } }));
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return new Response(null, { status: 202 });
  if (method === 'ping') return jsonResp(rpc(id, {}));
  if (method === 'tools/list') return jsonResp(rpc(id, { tools: TOOLS.map(mcpTool) }));
  if (method === 'tools/call') {
    const result = await callTool(params.name, params.arguments || {});
    const text = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
    return jsonResp(rpc(id, { content: [{ type: 'text', text }], isError: result.status >= 400 }));
  }
  const errBody = { jsonrpc: '2.0', id: id !== undefined ? id : null, error: { code: -32601, message: 'Method not found: ' + method } };
  return new Response(JSON.stringify(errBody), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' } });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE', 'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name' } });
    }
    if (request.method === 'GET') {
      if (url.pathname === '/tools') return jsonResp(TOOLS.map(t => ({ name: t.name, method: t.method, path: t.path })));
      return new Response(null, { status: 405, headers: { 'Allow': 'POST, OPTIONS', 'Access-Control-Allow-Origin': '*' } });
    }
    if (request.method === 'DELETE') {
      return new Response(null, { status: 405, headers: { 'Allow': 'POST, OPTIONS', 'Access-Control-Allow-Origin': '*' } });
    }
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body && body.jsonrpc === '2.0') {
          if (body.id === undefined) return new Response(null, { status: 202 });
          return handleMCP(body);
        }
        const { name, arguments: args } = body;
        const result = await callTool(name, args || {});
        return jsonResp(result, result.status && result.status >= 400 ? result.status : 200);
      } catch (e) {
        return jsonResp({ error: e.message }, 500);
      }
    }
    return new Response('Not found', { status: 404 });
  }
};`.trim()
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required. Sign in at /login' }, { status: 401 })
  }
  try {
    const { url: specUrl, name } = await request.json()
    if (!specUrl) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    const res = await fetch(specUrl, {
      headers: { 'User-Agent': 'apimcp-parser/1.0' },
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch spec: HTTP ${res.status}` }, { status: 400 })
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
    const safeName = (name || parsed.name || 'api').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api-server'
    const workerCode = generateWorkerCode(parsed, specUrl)

    const cfToken = process.env.CF_API_TOKEN
    const accountId = process.env.CF_ACCOUNT_ID
    const cfSubdomain = process.env.CF_SUBDOMAIN || 'vanshmehndiratta13'

    if (!cfToken || !accountId) {
      const deployUrl = 'https://' + safeName + '.' + cfSubdomain + '.workers.dev'
      return NextResponse.json({
        url: deployUrl,
        note: 'Dry run — deploy the CLI version for a live URL: apimcp deploy <spec>',
      })
    }

    const subdomain = safeName + '-' + Date.now().toString(36)
    const metadata = JSON.stringify({ main_module: 'worker.js' })
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2)

    let body = ''
    body += '--' + boundary + '\r\n'
    body += 'Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n'
    body += 'Content-Type: application/javascript+module\r\n\r\n'
    body += workerCode
    body += '\r\n--' + boundary + '\r\n'
    body += 'Content-Disposition: form-data; name="metadata"\r\n'
    body += 'Content-Type: application/json\r\n\r\n'
    body += metadata
    body += '\r\n--' + boundary + '--\r\n'

    const cfRes = await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + subdomain, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + cfToken,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      },
      body,
    })

    const cfText = await cfRes.text()
    let cfResult
    try { cfResult = JSON.parse(cfText) } catch { return NextResponse.json({ error: 'CF API response not JSON: ' + cfText.slice(0, 500) }, { status: 500 }) }
    if (!cfResult.success) {
      return NextResponse.json({ error: (cfResult.errors && cfResult.errors[0] && cfResult.errors[0].message) || 'Cloudflare API error' }, { status: 500 })
    }

    await fetch('https://api.cloudflare.com/client/v4/accounts/' + accountId + '/workers/scripts/' + subdomain + '/subdomain', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + cfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled: true }),
    })
    await new Promise(r => setTimeout(r, 3000))

    const deployUrl = 'https://' + subdomain + '.' + cfSubdomain + '.workers.dev'
    return NextResponse.json({ url: deployUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Deploy failed' }, { status: 500 })
  }
}
