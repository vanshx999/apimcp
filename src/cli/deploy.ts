import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function generateWorker(spec: any): string {
  const tools = spec.tools.map((t: any) => ({
    name: t.name,
    description: `${t.method} ${t.path}${t.description ? ` — ${t.description}` : ''}`,
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(
        t.parameters.map((p: any) => [
          p.name,
          { type: p.type || 'string', description: p.description }
        ])
      ),
      required: t.parameters.filter((p: any) => p.required).map((p: any) => p.name),
    },
  }));

  const servers = spec.serverUrl;

  return `
const SPEC = ${JSON.stringify({ tools, servers }, null, 2)};

function resolveUrl(path) {
  const base = SPEC.servers.replace(/\\/+$/, '');
  return base + path;
}

async function executeTool(name, args) {
  const tool = SPEC.tools.find(t => t.name === name);
  if (!tool) throw new Error(\`Unknown tool: \${name}\`);

  const [method, pathPattern] = tool.description.split(' ');
  let path = pathPattern;

  const query = new URLSearchParams();
  const headers = {};

  for (const key of Object.keys(args)) {
    const param = tool.inputSchema.properties[key];
    if (!param) continue;

    if (path.includes(\`{\${key}}\`)) {
      path = path.replace(\`{\${key}}\`, encodeURIComponent(String(args[key])));
    } else {
      query.set(key, String(args[key]));
    }
  }

  const url = resolveUrl(path) + (query.toString() ? '?' + query.toString() : '');
  const body = args.body ? JSON.stringify(args.body) : undefined;

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health' || request.method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({
        name: ${JSON.stringify(spec.name)},
        version: ${JSON.stringify(spec.version)},
        tools: SPEC.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      try {
        const { name, arguments: args } = await request.json();
        const result = await executeTool(name, args || {});
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
`.trim();
}

function generateWranglerConfig(name: string): string {
  return `name = "${name}"
main = "worker.js"
compatibility_date = "2026-07-22"
`;
}

export async function deployCommand(
  input: string,
  options: { name?: string; auth?: string }
): Promise<void> {
  console.error(chalk.dim(`\n  🚀 Preparing deploy for ${chalk.bold(input)}...\n`));

  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = await parseOpenAPISpec(specData, input);
  const name = options.name || spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api-server';
  const authToken = options.auth || '';

  const outDir = join(process.cwd(), `.apimcp-deploy-${name}`);
  mkdirSync(outDir, { recursive: true });

  const workerCode = generateWorker(spec);
  writeFileSync(join(outDir, 'worker.js'), workerCode, 'utf-8');
  writeFileSync(join(outDir, 'wrangler.toml'), generateWranglerConfig(name), 'utf-8');

  console.error(chalk.green(`  ✓ Generated worker for ${chalk.bold(spec.name)}`));
  console.error(chalk.dim(`    ${spec.tools.length} tools`));
  console.error(chalk.dim(`    Output: ${outDir}\n`));

  console.error(chalk.dim(`  Deploying with wrangler...\n`));

  try {
    const result = execSync(`npx wrangler deploy`, {
      cwd: outDir,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000,
    });

    const urlMatch = result.match(/https:\/\/[^\s]+\.workers\.dev/);
    const url = urlMatch ? urlMatch[0] : 'published';

    console.error(chalk.green(`  ✅ Deployed!`));
    console.error(chalk.dim(`    ${url}\n`));
    console.error(chalk.cyan(`  Usage:`));
    console.error(chalk.dim(`    GET  ${url}         — list tools`));
    console.error(chalk.dim(`    POST ${url}  { name, arguments } — call tool\n`));
  } catch (err: any) {
    console.error(chalk.red(`  ✘ Deploy failed:`));
    console.error(chalk.dim(`    ${err.stderr || err.message}`));
    console.error(chalk.dim(`\n  Files are at ${outDir}`));
    console.error(chalk.dim(`  Run: cd ${outDir} && npx wrangler deploy\n`));
  }
}
