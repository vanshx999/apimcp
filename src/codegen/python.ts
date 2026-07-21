import type { ParsedSpec, ToolDefinition, AuthConfig } from '../parser/types.js';

function sanitizeName(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

export function generatePython(spec: ParsedSpec): Record<string, string> {
  const depsList = ['mcp>=2.0.0b1,<3', 'httpx'];

  const lines: string[] = [
    'import os',
    'import httpx',
    'from mcp.server import MCPServer',
    '',
    `API_BASE_URL = os.environ.get("API_BASE_URL", "${spec.serverUrl}")`,
    'API_TOKEN = os.environ.get("API_TOKEN", "")',
    '',
    `mcp = MCPServer("${spec.name.replace(/"/g, '\\"')}")`,
    '',
    generateAuthSetup(spec.globalAuth),
    '',
  ];

  for (const tool of spec.tools) {
    lines.push(generateToolCode(tool));
    lines.push('');
  }

  lines.push('if __name__ == "__main__":');
  lines.push('    import sys');
  lines.push('    print(f"apimcp: Server started. Waiting for MCP client...", file=sys.stderr)');
  lines.push('    mcp.run()');
  lines.push('');

  return {
    'server.py': lines.join('\n'),
    'pyproject.toml': generatePyproject(spec, depsList),
  };
}

function generateAuthSetup(auth: AuthConfig): string {
  if (auth.type === 'none') {
    return [
      'def _get_headers() -> dict[str, str]:',
      '    return {"Accept": "application/json"}',
    ].join('\n');
  }
  if (auth.type === 'bearer') {
    return [
      'def _get_headers() -> dict[str, str]:',
      '    headers = {"Accept": "application/json"}',
      '    if API_TOKEN:',
      '        headers["Authorization"] = f"Bearer {API_TOKEN}"',
      '    return headers',
    ].join('\n');
  }
  if (auth.type === 'apiKey') {
    const headerName = auth.name ?? 'X-API-Key';
    return [
      'def _get_headers() -> dict[str, str]:',
      '    headers = {"Accept": "application/json"}',
      '    if API_TOKEN:',
      `        headers["${headerName}"] = API_TOKEN`,
      '    return headers',
    ].join('\n');
  }
  return [
    'def _get_headers() -> dict[str, str]:',
    '    return {"Accept": "application/json"}',
  ].join('\n');
}

function pyType(openapiType: string): string {
  switch (openapiType) {
    case 'integer': return 'int';
    case 'number': return 'float';
    case 'boolean': return 'bool';
    case 'array': return 'list';
    default: return 'str';
  }
}

function generateToolCode(tool: ToolDefinition): string {
  const pathParams = tool.parameters.filter(p => p.in === 'path');
  const queryParams = tool.parameters.filter(p => p.in === 'query');
  const headerParams = tool.parameters.filter(p => p.in === 'header');

  const funcName = sanitizeName(tool.name);

  // Build function signature - required first, then optional, then body
  const sigParams: string[] = [];
  const required = tool.parameters.filter(p => p.required);
  const optional = tool.parameters.filter(p => !p.required);
  for (const p of required) {
    sigParams.push(`${p.name}: ${pyType(p.type)}`);
  }
  for (const p of optional) {
    sigParams.push(`${p.name}: ${pyType(p.type)} | None = None`);
  }
  if (tool.hasBody) {
    sigParams.push('body: dict | None = None');
  }
  const lines: string[] = ['@mcp.tool()'];
  const sig = `def ${funcName}(${sigParams.join(', ')}) -> str:`;

  // Docstring
  lines.push(sig);
  if (tool.description) {
    lines.push(`    """${tool.description}"""`);
  }

  // Path construction
  let urlExpr = `API_BASE_URL + "${tool.path}"`;
  for (const p of pathParams) {
    urlExpr = `${urlExpr}.replace("{${p.name}}", str(${p.name}))`;
  }
  lines.push(`    url = ${urlExpr}`);

  // Query params
  if (queryParams.length > 0) {
    lines.push('    params: dict[str, str | int | float] = {}');
    for (const p of queryParams) {
      lines.push(`    if ${p.name} is not None:`);
      lines.push(`        params["${p.name}"] = ${p.name}`);
    }
  } else {
    lines.push('    params = None');
  }

  // Headers
  lines.push('    headers = _get_headers()');
  for (const p of headerParams) {
    lines.push(`    headers["${p.name}"] = str(${p.name})`);
  }

  // HTTP request
  if (tool.hasBody) {
    lines.push('    if body is not None:');
    lines.push(`        response = httpx.request("${tool.method}", url, headers=headers, params=params, json=body)`);
    lines.push('    else:');
    lines.push(`        response = httpx.request("${tool.method}", url, headers=headers, params=params)`);
  } else {
    lines.push(`    response = httpx.request("${tool.method}", url, headers=headers, params=params)`);
  }

  // Response handling
  lines.push('    try:');
  lines.push('        text = response.text');
  lines.push('        if not response.is_success:');
  lines.push('            return f"HTTP {response.status_code}: {text}"');
  lines.push('        try:');
  lines.push('            import json');
  lines.push('            parsed = response.json()');
  lines.push('            return json.dumps(parsed, indent=2)');
  lines.push('        except Exception:');
  lines.push('            return text');
  lines.push('    except Exception as e:');
  lines.push('        return f"Error: {e}"');

  return lines.join('\n');
}

function generatePyproject(spec: ParsedSpec, deps: string[]): string {
  const safeName = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api';
  return [
    '[project]',
    `name = "mcp-${safeName}"`,
    'version = "1.0.0"',
    `description = "MCP server for ${spec.name}"`,
    'requires-python = ">=3.10"',
    `dependencies = [${deps.map(d => `"${d}"`).join(', ')}]`,
    '',
  ].join('\n');
}
