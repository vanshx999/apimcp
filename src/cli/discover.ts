import chalk from 'chalk';
import { loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';
import { generateCode } from '../codegen/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DISCOVERY_PATHS = [
  '/openapi.json', '/openapi.yaml',
  '/swagger.json', '/swagger.yaml', '/swagger.yml',
  '/api/openapi.json', '/api/openapi.yaml',
  '/api/swagger.json', '/api/swagger.yaml',
  '/api-docs', '/api-docs/json', '/api-docs/yaml',
  '/v2/api-docs', '/v3/api-docs',
  '/.well-known/openapi.json', '/.well-known/openapi.yaml',
  '/spec.json', '/spec.yaml',
  '/api/v3/openapi.json', '/api/v2/openapi.json', '/api/v1/openapi.json',
];

async function tryLoadSpec(url: string): Promise<Record<string, unknown> | null> {
  try {
    return await loadSpecFromUrl(url);
  } catch {
    return null;
  }
}

function extractUrlAttr(html: string, tagName: string, attr: string, origin: string): string[] {
  const urls: string[] = [];
  const tagRegex = new RegExp(`<${tagName}\\b([^>]*?)>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(html)) !== null) {
    const attrs = match[1];
    const val = (attrs.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i')) ?? [])[1];
    if (val) {
      let url = val;
      if (url.startsWith('//')) url = 'https:' + url;
      else if (url.startsWith('/')) url = origin + url;
      else if (!url.startsWith('http')) url = origin + '/' + url;
      urls.push(url);
    }
  }
  return urls;
}

async function discoverFromJsContent(js: string, origin: string): Promise<Record<string, unknown> | null> {
  const specUrlPattern = /(?:url|definitionURL|specUrl|apiUrl|openapiUrl|swaggerUrl)\s*[=:]\s*["']([^"']+(?:openapi|swagger|api-docs|spec)[^"']*)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = specUrlPattern.exec(js)) !== null) {
    let specUrl = match[1];
    if (specUrl.startsWith('//')) specUrl = 'https:' + specUrl;
    else if (specUrl.startsWith('/')) specUrl = origin + specUrl;
    else if (!specUrl.startsWith('http')) specUrl = origin + '/' + specUrl;
    const data = await tryLoadSpec(specUrl);
    if (data) return data;
  }

  const rawUrlPattern = /["'](https?:\/\/[^"']+(?:openapi\.json|swagger\.json|openapi\.yaml|swagger\.yaml)[^"']*)["']/gi;
  while ((match = rawUrlPattern.exec(js)) !== null) {
    const data = await tryLoadSpec(match[1]);
    if (data) return data;
  }

  return null;
}

async function discoverFromHtmlPage(pageUrl: string, origin: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(pageUrl, { headers: { 'Accept': 'text/html,*/*' } });
    if (!res.ok) return null;
    const html = await res.text();

    const linkSpecUrls = extractUrlAttr(html, 'link', 'href', origin);
    for (const specUrl of linkSpecUrls) {
      const data = await tryLoadSpec(specUrl);
      if (data) return data;
    }

    const scriptSrcs = extractUrlAttr(html, 'script', 'src', origin);
    for (const scriptUrl of scriptSrcs) {
      try {
        const jsRes = await fetch(scriptUrl);
        if (jsRes.ok) {
          const js = await jsRes.text();
          const fromJs = await discoverFromJsContent(js, origin);
          if (fromJs) return fromJs;
        }
      } catch { /* ignore */ }
    }

    const fromInlineJs = await discoverFromJsContent(html, origin);
    if (fromInlineJs) return fromInlineJs;

  } catch { /* ignore */ }
  return null;
}

export async function discoverAndLoadSpec(inputUrl: string): Promise<{ spec: any; specUrl: string }> {
  const normalized = inputUrl.startsWith('http://') || inputUrl.startsWith('https://')
    ? inputUrl : 'https://' + inputUrl;

  const base = new URL(normalized);
  const origin = base.origin;

  if (base.pathname.endsWith('.json') || base.pathname.endsWith('.yaml') || base.pathname.endsWith('.yml')) {
    const data = await loadSpecFromUrl(normalized);
    const spec = await parseOpenAPISpec(data, normalized);
    return { spec, specUrl: normalized };
  }

  for (const p of DISCOVERY_PATHS) {
    const data = await tryLoadSpec(origin + p);
    if (data) {
      const spec = await parseOpenAPISpec(data, origin + p);
      return { spec, specUrl: origin + p };
    }
  }

  const fromHtml = await discoverFromHtmlPage(normalized, origin);
  if (fromHtml) {
    const spec = await parseOpenAPISpec(fromHtml, normalized);
    return { spec, specUrl: `${origin} (auto-detected)` };
  }

  throw new Error(`Could not find an OpenAPI spec at ${inputUrl}`);
}

export async function discoverCommand(
  url: string,
  options: { serve?: boolean; generate?: boolean; lang?: string; output?: string; auth?: string }
): Promise<void> {
  console.error(chalk.dim(`\n  🔎 Discovering OpenAPI spec at ${chalk.bold(url)}...\n`));

  const { spec, specUrl } = await discoverAndLoadSpec(url);

  console.error(chalk.green(`  ✓ Found: ${chalk.bold(spec.name)} v${spec.version}`));
  console.error(chalk.dim(`    Spec URL: ${specUrl}`));
  console.error(chalk.dim(`    ${spec.tools.length} tools, ${spec.serverUrl}\n`));

  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
    PATCH: chalk.magenta, DELETE: chalk.red,
  };

  for (const tool of spec.tools) {
    const color = methodColors[tool.method] ?? chalk.white;
    const method = color(tool.method.padEnd(6));
    const params = tool.parameters.filter((p: any) => p.required).map((p: any) => p.name).join(', ');
    const paramStr = params ? chalk.dim(` <${params}>`) : '';
    console.error(`  ${method} ${tool.path}${paramStr}`);
    console.error(`         ${chalk.cyan(tool.name)}${tool.description ? chalk.dim(` — ${tool.description}`) : ''}`);
  }

  console.error(`\n  ${chalk.green('◉')} ${chalk.bold(String(spec.tools.length))} tools discovered\n`);

  if (options.serve) {
    console.error(chalk.green(`  ◉ Starting server with ${spec.tools.length} tools via stdio...\n`));
    await startProxyServer(spec, options.auth || undefined);
    return;
  }

  if (options.generate) {
    const lang = options.lang || 'ts';
    const safeName = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api';
    const outDir = options.output || `./mcp-${safeName}`;
    console.error(chalk.dim(`  Generating ${lang === 'py' ? 'Python' : 'TypeScript'} server...`));
    const files = generateCode(spec, lang);
    mkdirSync(outDir, { recursive: true });
    for (const [filename, code] of Object.entries(files)) {
      writeFileSync(join(outDir, filename), code, 'utf-8');
    }
    console.error(chalk.green(`  ✓ Generated ${Object.keys(files).length} files to ${chalk.bold(outDir)}`));
    const runCmd = lang === 'py' ? 'pip install -e . && python server.py' : 'npm install && npm start';
    console.error(chalk.dim(`\n  cd ${outDir}`));
    console.error(chalk.dim(`  ${runCmd}\n`));
  }
}
