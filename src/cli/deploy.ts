import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function generateWorker(spec: any): string {
  const tools = spec.tools.map((t: any) => ({
    name: t.name,
    method: t.method,
    path: t.path,
    description: t.description || '',
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(
        t.parameters.map((p: any) => [
          p.name,
          { type: p.type || 'string', description: p.description || '' }
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

  const { method, path: pattern } = tool;
  let path = pattern;
  const query = new URLSearchParams();
  let body;

  for (const key of Object.keys(args || {})) {
    if (path.includes(\`{\${key}}\`)) {
      path = path.replace(\`{\${key}}\`, encodeURIComponent(String(args[key])));
    } else if (key === 'body') {
      body = typeof args.body === 'string' ? args.body : JSON.stringify(args.body);
    } else {
      query.set(key, String(args[key]));
    }
  }

  const url = resolveUrl(path) + (query.toString() ? '?' + query.toString() : '');

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'apimcp-worker/1.0',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' && body ? body : undefined,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'GET' || (request.method === 'POST' && url.pathname === '/tools')) {
      const toolList = SPEC.tools.map(t => ({
        name: t.name,
        description: t.description ? \`\${t.method} \${t.path} — \${t.description}\` : \`\${t.method} \${t.path}\`,
        inputSchema: t.inputSchema,
      }));
      return new Response(JSON.stringify({
        name: ${JSON.stringify(spec.name)},
        version: ${JSON.stringify(spec.version)},
        tools: toolList,
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method === 'POST') {
      try {
        const { name, arguments: args } = await request.json();
        if (!name) throw new Error('Missing "name" field');
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

    return new Response('Not found. Use GET / for tools list, POST / to call a tool.', { status: 404 });
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
  options: { name?: string; auth?: string; dryRun?: boolean }
): Promise<void> {
  console.error(chalk.dim(`\n  🚀 ${chalk.bold('apimcp deploy')} — ${chalk.bold(input)}\n`));

  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = await parseOpenAPISpec(specData, input);
  const name = options.name || spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api-server';

  const outDir = join(process.cwd(), `.apimcp-deploy-${name}`);
  mkdirSync(outDir, { recursive: true });

  const workerCode = generateWorker(spec);
  writeFileSync(join(outDir, 'worker.js'), workerCode, 'utf-8');
  writeFileSync(join(outDir, 'wrangler.toml'), generateWranglerConfig(name), 'utf-8');

  console.error(chalk.green(`  ✓ Worker generated`));
  console.error(chalk.dim(`    API: ${chalk.bold(spec.name)} v${spec.version}`));
  console.error(chalk.dim(`    Tools: ${spec.tools.length}`));
  console.error(chalk.dim(`    Files: ${outDir}\n`));

  if (options.dryRun) {
    console.error(chalk.dim(`  Dry run — files ready at ${outDir}`));
    console.error(chalk.dim(`  To deploy: cd ${outDir} && npx wrangler deploy\n`));
    return;
  }

  console.error(chalk.dim(`  Deploying to Cloudflare Workers...\n`));

  try {
    const result = execSync(`npx --yes wrangler deploy`, {
      cwd: outDir,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 180000,
    });

    const urlMatch = result.match(/https:\/\/[^\s]+\.workers\.dev/);
    const url = urlMatch ? urlMatch[0] : 'published';

    console.error(chalk.green(`  ✅ Deployed!\n`));
    console.error(chalk.dim(`    ${chalk.bold(url)}\n`));
    console.error(chalk.cyan(`  Usage:`));
    console.error(chalk.dim(`    GET  ${url}                             — list tools`));
    console.error(chalk.dim(`    POST ${url}  { "name": "...", "arguments": {...} }  — call tool\n`));
  } catch (err: any) {
    const msg = err.stderr || err.message || String(err);
    if (msg.includes('CLOUDFLARE_API_TOKEN') || msg.includes('In a non-interactive environment')) {
      console.error(chalk.yellow(`  ⚡ Cloudflare API token required`));
      console.error(chalk.dim(`\n  To deploy, you need a Cloudflare account (free, no credit card):`));
      console.error(chalk.dim(`  1. Sign up: ${chalk.cyan('https://dash.cloudflare.com/sign-up')}`));
      console.error(chalk.dim(`  2. Create token: ${chalk.cyan('https://dash.cloudflare.com/profile/api-tokens')}`));
      console.error(chalk.dim(`     → "Create Token" → "Edit Cloudflare Workers" template`));
      console.error(chalk.dim(`  3. Run: ${chalk.cyan('cd ' + outDir + ' && CLOUDFLARE_API_TOKEN=<token> npx wrangler deploy')}\n`));
    } else {
      console.error(chalk.red(`  ✘ Deploy failed:`));
      console.error(chalk.dim(`    ${msg}`));
      console.error(chalk.dim(`\n  Files are at: ${outDir}`));
      console.error(chalk.dim(`  Run: cd ${outDir} && npx wrangler deploy\n`));
    }
  }
}
