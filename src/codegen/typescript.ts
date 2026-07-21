import type { ParsedSpec, ToolDefinition, AuthConfig } from '../parser/types.js';

export function generateTypeScript(spec: ParsedSpec): Record<string, string> {
  const toolsCode = spec.tools.map(t => generateToolCode(t, spec.serverUrl)).join('\n\n');
  const authSetup = generateAuthSetup(spec.globalAuth);

  const serverCode = `import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const API_BASE_URL = process.env.API_BASE_URL ?? '${spec.serverUrl}';
const API_TOKEN = process.env.API_TOKEN ?? '';

${authSetup}

const server = new McpServer({
  name: '${spec.name}',
  version: '${spec.version}',
});

${toolsCode}

async function main() {
  const transport = new StdioServerTransport();
  console.error('apimcp: Server started. Waiting for MCP client...');
  await server.connect(transport);
}

main().catch(console.error);
`;

  const tsconfig = JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: 'dist',
    },
    include: ['server.ts'],
  }, null, 2);

  return { 'server.ts': serverCode, 'package.json': generatePackageJson(spec), 'tsconfig.json': tsconfig };
}

function generateAuthSetup(auth: AuthConfig): string {
  if (auth.type === 'none') {
    return `function authHeaders(): Record<string, string> { return {}; }`;
  }
  if (auth.type === 'bearer') {
    return `function authHeaders(): Record<string, string> {
  return API_TOKEN ? { Authorization: \`Bearer \${API_TOKEN}\` } : {};
}`;
  }
  if (auth.type === 'apiKey') {
    const headerName = auth.name ?? 'X-API-Key';
    return `function authHeaders(): Record<string, string> {
  return API_TOKEN ? { '${headerName}': API_TOKEN } : {};
}`;
  }
  return `function authHeaders(): Record<string, string> {
  return API_TOKEN ? { Authorization: \`Basic \${Buffer.from(':' + API_TOKEN).toString('base64')}\` } : {};
}`;
}

function generateToolCode(tool: ToolDefinition, serverUrl: string): string {
  const hasParams = tool.parameters.length > 0;

  const paramNames = tool.parameters.map(p => p.name);
  const destrParams = [...paramNames, ...(tool.hasBody ? ['body'] : [])].join(', ');
  const typeParams = tool.parameters.map(p => {
    const tsType = p.type === 'integer' || p.type === 'number' ? 'number' :
                   p.type === 'boolean' ? 'boolean' : 'string';
    return `${p.name}${p.required ? '' : '?'}: ${tsType}`;
  }).join(', ');
  const typeStr = typeParams + (tool.hasBody ? `${typeParams ? ', ' : ''}body?: Record<string, unknown>` : '');
  const destrLine = destrParams ? `{${destrParams}}` : '';

  const zodFields = tool.parameters.map(p => {
    let zType = p.type === 'integer' ? 'z.number()' :
                p.type === 'number' ? 'z.number()' :
                p.type === 'boolean' ? 'z.boolean()' : 'z.string()';
    if (!p.required) zType = `z.optional(${zType})`;
    const desc = p.description ? `.describe('${p.description.replace(/'/g, "\\'")}')` : '';
    return `    ${p.name}: ${zType}${desc}`;
  });
  if (tool.hasBody) {
    zodFields.push('    body: z.optional(z.record(z.string(), z.unknown()))');
  }
  const zodBody = zodFields.length > 0 ? `z.object({\n${zodFields.join(',\n')}\n  })` : 'z.object({})';

  const pathParams = tool.parameters.filter(p => p.in === 'path');
  const queryParams = tool.parameters.filter(p => p.in === 'query');
  const headerParams = tool.parameters.filter(p => p.in === 'header');

  const pathReplacements = pathParams.map(p =>
    `.replace('{${p.name}}', encodeURIComponent(String(${p.name})))`
  ).join('');

  const queryString = queryParams.length > 0
    ? `\n  const qs = new URLSearchParams();\n${
        queryParams.map(p =>
          `  if (${p.name} !== undefined) qs.append('${p.name}', String(${p.name}));`
        ).join('\n')
      }\n  const qstr = qs.toString();\n  url += qstr ? '?' + qstr : '';`
    : '';

  const headerCode = headerParams.length > 0
    ? `\n  ${headerParams.map(p =>
        `headers['${p.name}'] = String(${p.name});`
      ).join('\n  ')}`
    : '';

  const bodyCode = tool.hasBody
    ? `\n  if (body) fetchOpts.body = JSON.stringify(body);`
    : '';

  const destrCode = destrLine
    ? `    const ${destrLine} = args as {${typeStr}};`
    : '    const args_ = args;';

  return `server.registerTool(
  '${tool.name}',
  {
    description: '${tool.method} ${tool.path}${tool.description ? ` — ${tool.description.replace(/'/g, "\\'")}` : ''}',
    inputSchema: ${zodBody},
  },
  async (args: Record<string, unknown>) => {
${destrCode}
    let url = API_BASE_URL + '${tool.path}'${pathReplacements};
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };${headerCode}
${queryString}
    const fetchOpts: RequestInit = { method: '${tool.method}', headers };${bodyCode}

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);`;
}

function generatePackageJson(spec: ParsedSpec): string {
  return JSON.stringify({
    name: `mcp-${spec.name.toLowerCase().replace(/\s+/g, '-')}`,
    version: '1.0.0',
    type: 'module',
    private: true,
    scripts: { start: 'node server.ts' },
    dependencies: {
      '@modelcontextprotocol/server': '2.0.0-beta.4',
      zod: '^4.1.8',
    },
    devDependencies: { typescript: '^5.8.0', '@types/node': '^22.0.0' },
  }, null, 2);
}
