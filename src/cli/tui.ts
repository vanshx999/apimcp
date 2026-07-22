import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';
import { generateCode } from '../codegen/index.js';
import { discoverAndLoadSpec } from './discover.js';
import { deployCommand } from './deploy.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const POPULAR_APIS: Record<string, string> = {
  'Petstore API (demo)': 'https://petstore3.swagger.io/api/v3/openapi.json',
  'GitHub REST API': 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/ghes-3.16/ghes-3.16.json',
  'Stripe API': 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json',
  'OpenAI API': 'https://raw.githubusercontent.com/OpenAI/openai-openapi/master/openapi.yaml',
  'SendGrid API': 'https://raw.githubusercontent.com/sendgrid/sendgrid-oai/main/oai.yaml',
};

function showBanner(): void {
  console.error(`
  ${chalk.bold('╭──────────────────────────────────────╮')}
  ${chalk.bold('│')}  ${chalk.cyan(chalk.bold('apimcp'))}                      ${chalk.bold('│')}
  ${chalk.bold('│')}  ${chalk.dim('OpenAPI spec → MCP server')}    ${chalk.bold('│')}
  ${chalk.bold('╰──────────────────────────────────────╯')}
  `);
}

function showTools(spec: { name: string; version: string; serverUrl: string; tools: Array<{ method: string; path: string; name: string; description: string; parameters: Array<{ name: string; required: boolean }> }> }): void {
  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
    PATCH: chalk.magenta, DELETE: chalk.red,
  };

  console.error(`  ${chalk.bold(spec.name)} ${chalk.dim(`v${spec.version}`)}`);
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

  console.error(`\n  ${chalk.green('●')} ${chalk.bold(String(spec.tools.length))} tools\n`);
}

async function getSpecFromUser(): Promise<{ specData: Record<string, unknown>; spec: any; input: string }> {
  const source = await clack.select({
    message: 'Choose a spec source:',
    options: [
      { value: 'popular', label: 'Popular API', hint: 'Pick from a curated list' },
      { value: 'url', label: 'URL', hint: 'Paste any OpenAPI spec URL' },
      { value: 'discover', label: 'Discover', hint: 'Auto-find spec from any website URL' },
      { value: 'file', label: 'File path', hint: 'Local .json or .yaml file' },
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
  } else if (source === 'discover') {
    const input = await clack.text({
      message: 'Enter any website URL:',
      placeholder: 'https://petstore.swagger.io',
      validate: (val) => (val ?? '').length === 0 ? 'URL is required' : undefined,
    });
    if (clack.isCancel(input)) { clack.cancel('Cancelled'); process.exit(0); }
    const s = clack.spinner();
    s.start('Discovering OpenAPI spec...');
    const { spec } = await discoverAndLoadSpec(input as string);
    s.stop(`Found "${spec.name}" (${spec.tools.length} tools)`);
    return { specData: null as unknown as Record<string, unknown>, spec, input: input as string };
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
      { value: 'inspect', label: 'Inspect spec', hint: 'list all API endpoints as tools' },
      { value: 'serve', label: 'Serve as MCP server', hint: 'connect AI agents instantly via stdio' },
      { value: 'generate', label: 'Generate server code', hint: 'TypeScript or Python output' },
      { value: 'deploy', label: 'Deploy to Cloudflare', hint: 'one-command deploy to a live URL' },
      { value: 'help', label: 'Help', hint: 'show CLI usage and examples' },
    ],
  });

  if (clack.isCancel(mode)) { clack.cancel('Cancelled'); process.exit(0); }

  if (mode === 'help') {
    console.error(`\n  ${chalk.bold('apimcp')} — ${chalk.dim('Convert any OpenAPI spec into an MCP server')}\n`);
    console.error(`  ${chalk.bold('Commands:')}`);
    console.error(`    ${chalk.cyan('apimcp')}                        Open this interactive TUI`);
    console.error(`    ${chalk.cyan('apimcp demo')}                   Run a demo with Petstore API`);
    console.error(`    ${chalk.cyan('apimcp inspect <spec>')}         List all tools from a spec`);
    console.error(`    ${chalk.cyan('apimcp serve <spec>')}           Start MCP proxy server (stdio)`);
    console.error(`    ${chalk.cyan('apimcp generate <spec>')}        Generate server source code`);
    console.error(`    ${chalk.cyan('apimcp discover <url>')}         Auto-find spec from a website`);
    console.error(`    ${chalk.cyan('apimcp deploy <spec>')}          Deploy to Cloudflare Workers\n`);
    console.error(`  ${chalk.bold('Examples:')}`);
    console.error(`    ${chalk.dim('apimcp demo')}`);
    console.error(`    ${chalk.dim('apimcp discover petstore.swagger.io')}`);
    console.error(`    ${chalk.dim('apimcp deploy https://.../openapi.json --dry-run')}\n`);
    return;
  }

  if (mode === 'inspect') {
    const { spec } = await getSpecFromUser();
    showTools(spec);
    return;
  }

  if (mode === 'deploy') {
    const { spec, input } = await getSpecFromUser();
    showTools(spec);
    await deployCommand(input, { dryRun: true });
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

    console.error(chalk.dim(`\n  Listening for MCP client connections...\n`));
    await startProxyServer(spec, auth || undefined);
  }
}
