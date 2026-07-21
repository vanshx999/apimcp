import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';
import { generateCode } from '../codegen/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const POPULAR_APIS: Record<string, string> = {
  '🐶  Petstore API (demo)': 'https://petstore3.swagger.io/api/v3/openapi.json',
  '🐙  GitHub REST API': 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.16/ghes-3.16.json',
  '💳  Stripe API': 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
  '☁️  OpenAI API': 'https://raw.githubusercontent.com/OpenAI/openai-openapi/master/openapi.yaml',
  '📧  SendGrid API': 'https://raw.githubusercontent.com/sendgrid/sendgrid-oai/main/oai.yaml',
};

function showBanner(): void {
  console.error(chalk.cyan(`
  ╔══════════════════════════════════════╗
  ║        ${chalk.bold('apimcp')}          ║
  ║  ${chalk.dim('OpenAPI spec → MCP server')} ║
  ╚══════════════════════════════════════╝
  `));
}

function showTools(spec: { name: string; version: string; serverUrl: string; tools: Array<{ method: string; path: string; name: string; description: string; parameters: Array<{ name: string; required: boolean }> }> }): void {
  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
    PATCH: chalk.magenta, DELETE: chalk.red,
  };

  console.error(`\n  ${chalk.bold(spec.name)} v${spec.version}`);
  console.error(chalk.dim(`  ${spec.serverUrl}\n`));

  for (const tool of spec.tools) {
    const color = methodColors[tool.method] ?? chalk.white;
    const method = color(tool.method.padEnd(6));
    const required = tool.parameters.filter(p => p.required).map(p => p.name).join(', ');
    const params = required ? chalk.dim(` <${required}>`) : '';
    const desc = tool.description ? chalk.dim(` — ${tool.description}`) : '';
    console.error(`  ${method} ${tool.path}${params}`);
    console.error(`         ${chalk.cyan(tool.name)}${desc}`);
  }

  console.error(`\n  ${chalk.green('◉')} ${chalk.bold(String(spec.tools.length))} tools\n`);
}

async function getSpecFromUser(): Promise<{ specData: Record<string, unknown>; spec: any; input: string }> {
  const source = await clack.select({
    message: 'Choose a spec source:',
    options: [
      { value: 'popular', label: '⭐  Popular API', hint: 'Pick from a curated list' },
      { value: 'url', label: '🔗  URL', hint: 'Paste any OpenAPI spec URL' },
      { value: 'file', label: '📁  File path', hint: 'Local .json or .yaml file' },
    ],
  });

  if (clack.isCancel(source)) { clack.cancel('Cancelled'); process.exit(0); }

  let specUrl = '';
  if (source === 'popular') {
    const choice = await clack.select({
      message: 'Select an API:',
      options: Object.entries(POPULAR_APIS).map(([label, url]) => ({ value: url, label })),
    });
    if (clack.isCancel(choice)) { clack.cancel('Cancelled'); process.exit(0); }
    specUrl = choice as string;
  } else if (source === 'url') {
    const input = await clack.text({
      message: 'Enter OpenAPI spec URL:',
      placeholder: 'https://petstore3.swagger.io/api/v3/openapi.json',
      validate: (val) => (val ?? '').length === 0 ? 'URL is required' : undefined,
    });
    if (clack.isCancel(input)) { clack.cancel('Cancelled'); process.exit(0); }
    specUrl = input as string;
  } else {
    const input = await clack.text({
      message: 'Enter file path:',
      placeholder: './openapi.yaml',
      validate: (val) => (val ?? '').length === 0 ? 'Path is required' : undefined,
    });
    if (clack.isCancel(input)) { clack.cancel('Cancelled'); process.exit(0); }
    const s = clack.spinner();
    s.start('Loading spec...');
    const specData = loadSpecFromFile(input as string);
    const spec = await parseOpenAPISpec(specData, input as string);
    s.stop(`Found ${spec.tools.length} tools`);
    return { specData, spec, input: input as string };
  }

  const s = clack.spinner();
  s.start('Fetching and parsing spec...');
  const specData = await loadSpecFromUrl(specUrl);
  const spec = await parseOpenAPISpec(specData, specUrl);
  s.stop(`Found ${spec.tools.length} tools from "${spec.name}"`);
  return { specData, spec, input: specUrl };
}

export async function runTUI(): Promise<void> {
  showBanner();

  const mode = await clack.select({
    message: 'What do you want to do?',
    options: [
      { value: 'inspect', label: '🔍  Inspect spec', hint: 'list all API endpoints as tools' },
      { value: 'serve', label: '▶  Serve as MCP server', hint: 'connect AI agents instantly' },
      { value: 'generate', label: '📦  Generate server code', hint: 'TypeScript or Python output' },
      { value: 'help', label: '❓  Help', hint: 'show CLI usage' },
    ],
  });

  if (clack.isCancel(mode)) { clack.cancel('Cancelled'); process.exit(0); }

  if (mode === 'help') {
    console.error(`\n  ${chalk.bold('Usage:')}`);
    console.error(`    apimcp                   Open this interactive TUI`);
    console.error(`    apimcp serve <spec>      Start MCP server (proxy mode)`);
    console.error(`    apimcp generate <spec>   Generate server code`);
    console.error(`    apimcp inspect <spec>    List all tools\n`);
    return;
  }

  if (mode === 'inspect') {
    const { spec } = await getSpecFromUser();
    showTools(spec);
    return;
  }

  if (mode === 'generate') {
    const { spec } = await getSpecFromUser();
    showTools(spec);

    const lang = await clack.select({
      message: 'Output language:',
      options: [
        { value: 'ts', label: 'TypeScript' },
        { value: 'py', label: 'Python' },
      ],
    });

    if (clack.isCancel(lang)) { clack.cancel('Cancelled'); process.exit(0); }

    const safeName = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api';
    const dir = (await clack.text({
      message: 'Output directory:',
      placeholder: `./mcp-${safeName}`,
    })) as string;

    if (clack.isCancel(dir)) { clack.cancel('Cancelled'); process.exit(0); }

    const gen = clack.spinner();
    gen.start('Generating server...');
    const outDir = dir || `./mcp-${safeName}`;
    const files = generateCode(spec, lang as string);
    mkdirSync(outDir, { recursive: true });
    for (const [filename, code] of Object.entries(files)) {
      writeFileSync(join(outDir, filename), code, 'utf-8');
    }
    gen.stop(`Generated ${Object.keys(files).length} files`);

    const runCmd = lang === 'py' ? 'pip install -e . && python server.py' : 'npm install && npm start';
    console.error(chalk.dim(`\n  cd ${outDir}`));
    console.error(chalk.dim(`  ${runCmd}\n`));
    return;
  }

  if (mode === 'serve') {
    const { spec } = await getSpecFromUser();
    showTools(spec);

    const auth = (await clack.text({
      message: 'API token (optional, press Enter to skip):',
      placeholder: 'sk-...',
    })) as string;

    if (clack.isCancel(auth)) { clack.cancel('Cancelled'); process.exit(0); }

    console.error(chalk.green(`\n  ◉ Starting server with ${spec.tools.length} tools via stdio...\n`));
    await startProxyServer(spec, auth || undefined);
  }
}
