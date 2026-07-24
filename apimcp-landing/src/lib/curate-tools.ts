export type CuratedEndpoint = {
  method: string
  path: string
  toolName: string
  summary: string
  description: string
  parameters: { name: string; in: string; required: boolean; type: string; description: string }[]
  hasBody: boolean
  group: string
}

export type CuratedGroup = {
  name: string
  description: string
  endpoints: CuratedEndpoint[]
}

export type CuratedResult = {
  name: string
  version: string
  serverUrl: string
  groups: CuratedGroup[]
  endpoints: CuratedEndpoint[]
}

const LOW_VALUE_PATHS = [/\/health/, /\/swagger/, /\/openapi/, /\/docs?$/, /\/metrics/, /\/favicon/]

function isLowValue(method: string, path: string): boolean {
  for (const re of LOW_VALUE_PATHS) {
    if (re.test(path)) return true
  }
  return false
}

function inferResource(path: string, tags?: string[]): string {
  if (tags && tags.length > 0) return tags[0]
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
  return parts[0] || 'general'
}

function normalizeResourceName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
}

function generateToolName(operationId: string | undefined, method: string, path: string, resource: string): string {
  if (operationId) {
    return operationId
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 64)
  }
  const pathParts = path.replace(/^\/+/, '').split('/').filter(p => !p.startsWith('{'))
  const action = pathParts.slice(1).join('_') || resource
  const verb = methodToVerb(method, path)
  return `${verb}_${action}`.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '').substring(0, 64)
}

function methodToVerb(method: string, path: string): string {
  const m = method.toLowerCase()
  if (m === 'get' && !/{.*}$/.test(path)) return 'list'
  if (m === 'get') return 'get'
  if (m === 'post' && /\/[^/]+$/.test(path) && !path.endsWith('}')) return 'create'
  if (m === 'post') return 'execute'
  if (m === 'put') return 'update'
  if (m === 'patch') return 'patch'
  if (m === 'delete') return 'delete'
  return m
}

function agentSummary(method: string, path: string, originalSummary: string, resource: string): string {
  if (originalSummary) return originalSummary
  const verb = methodToVerb(method, path)
  const parts = path.replace(/^\/+/, '').split('/').filter(p => !p.startsWith('{'))
  const object = parts.slice(1).join(' ') || resource
  const label = resource.replace(/_/g, ' ')
  return `${verb} ${object} in ${label}`.replace(/\s+/g, ' ').trim()
}

function agentDescription(method: string, path: string, originalDescription: string, summary: string, resource: string): string {
  if (originalDescription && originalDescription.length > 20) return originalDescription
  const label = resource.replace(/_/g, ' ')
  const urlExample = path.replace(/\{[^}]+\}/g, '<id>')
  return `${summary} — Use this tool when you need to ${summary.toLowerCase()}. Endpoint: ${method.toUpperCase()} ${urlExample}`
}

function dedupEndpoints(endpoints: CuratedEndpoint[]): CuratedEndpoint[] {
  const seen = new Set<string>()
  return endpoints.filter(ep => {
    const key = `${ep.method}:${ep.path}:${ep.toolName}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function curateEndpoints(
  endpoints: { method: string; path: string; toolName: string; summary: string; description: string; parameters: any[]; hasBody: boolean; tags?: string[] }[]
): CuratedGroup[] {
  const rawGroups = new Map<string, CuratedEndpoint[]>()

  for (const ep of endpoints) {
    if (isLowValue(ep.method, ep.path)) continue
    const resource = normalizeResourceName(inferResource(ep.path, ep.tags))
    if (!rawGroups.has(resource)) rawGroups.set(resource, [])
    const curated: CuratedEndpoint = {
      method: ep.method,
      path: ep.path,
      toolName: generateToolName(ep.toolName, ep.method, ep.path, resource),
      summary: agentSummary(ep.method, ep.path, ep.summary, resource),
      description: agentDescription(ep.method, ep.path, ep.description, ep.summary, resource),
      parameters: ep.parameters.map(p => ({
        name: p.name,
        in: p.in || 'query',
        required: !!p.required,
        type: (p.type) || 'string',
        description: p.description || '',
      })),
      hasBody: ep.hasBody,
      group: resource,
    }
    rawGroups.get(resource)!.push(curated)
  }

  const groups: CuratedGroup[] = []
  for (const [name, items] of rawGroups) {
    const clean = dedupEndpoints(items)
    if (clean.length === 0) continue
    groups.push({
      name,
      description: `Tools for managing ${name.replace(/_/g, ' ')} — ${clean.length} operations available`,
      endpoints: clean,
    })
  }

  return groups.sort((a, b) => a.name.localeCompare(b.name))
}
