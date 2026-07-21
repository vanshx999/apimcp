import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';
import { generateCode } from '../codegen/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

function showBanner(): void {
  console.error(chalk.cyan(`
   ╔══════════════════════════════════════╗
   ║           ${chalk.bold('apimcp')}             ║
   ║  ${chalk.dim('OpenAPI → MCP Server')}   ║
   ╚══════════════════════════════════════╝
  `));
}

export async function runTUI(): Promise<void> {
  showBanner();

  const mode = await clack.select({
    message: 'What do you want to do?',
    options: [
      { value: 'inspect', label: '🔍  Inspect spec', hint: 'list all tools' },
      { value: 'serve', label: '▶  Serve as MCP server', hint: 'runtime proxy' },
      { value: 'generate', label: '📦  Generate server code', hint: 'TypeScript / Python' },
      { value: 'help', label: '❓  Help', hint: 'show CLI usage' },
    ],
  });

  if (clack.isCancel(mode)) {
    clack.cancel('Cancelled');
    process.exit(0);
  }

  if (mode === 'help') {
    console.error(`\n  ${chalk.bold('Usage:')}`);
    console.error(`    apimcp serve <spec>      Start MCP server (proxy mode)`);
    console.error(`    apimcp generate <spec>    Generate server code`);
    console.error(`    apimcp inspect <spec>     List all tools from a spec`);
    console.error(`    apimcp                    Launch this interactive TUI\n`);
    return;
  }

  const input = await clack.text({
    message: 'Enter OpenAPI spec URL or file path:',
    placeholder: 'https://petstore3.swagger.io/api/v3/openapi.json',
    validate: (val) => (val ?? '').length === 0 ? 'Spec is required' : undefined,
  });

  if (clack.isCancel(input)) {
    clack.cancel('Cancelled');
    process.exit(0);
  }

  const s = clack.spinner();
  s.start('Fetching and parsing spec...');

  try {
    const specData = (input as string).startsWith('http://') || (input as string).startsWith('https://')
      ? await loadSpecFromUrl(input as string)
      : loadSpecFromFile(input as string);

    const spec = await parseOpenAPISpec(specData, input as string);
    s.stop(`Found ${spec.tools.length} tools from "${spec.name}"`);

    if (mode === 'inspect') {
      showTools(spec);
      return;
    }

    if (mode === 'generate') {
      const lang = await clack.select({
        message: 'Output language:',
        options: [
          { value: 'ts', label: 'TypeScript' },
          { value: 'py', label: 'Python' },
        ],
      });

      if (clack.isCancel(lang)) {
        clack.cancel('Cancelled');
        process.exit(0);
      }

      const outDir = (await clack.text({
        message: 'Output directory:',
        placeholder: `./mcp-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api'}`,
      })) as string;

      if (clack.isCancel(outDir)) {
        clack.cancel('Cancelled');
        process.exit(0);
      }

      const gen = clack.spinner();
      gen.start('Generating server...');
      const safeName = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api';
      const dir = outDir || `./mcp-${safeName}`;
      const files = generateCode(spec, lang as string);
      mkdirSync(dir, { recursive: true });
      for (const [filename, code] of Object.entries(files)) {
        writeFileSync(join(dir, filename), code, 'utf-8');
      }
      gen.stop(`Generated ${Object.keys(files).length} files`);

      const runCmd = lang === 'py' ? `pip install -e . && python server.py` : `npm install && npm start`;
      console.error(chalk.dim(`\n  cd ${dir}`));
      console.error(chalk.dim(`  ${runCmd}\n`));
      return;
    }

    if (mode === 'serve') {
      showTools(spec);

      const auth = (await clack.text({
        message: 'API token (optional, press Enter to skip):',
        placeholder: 'sk-...',
      })) as string;

      if (clack.isCancel(auth)) {
        clack.cancel('Cancelled');
        process.exit(0);
      }

      console.error(chalk.green(`\n  ◉ Starting server with ${spec.tools.length} tools via stdio...\n`));
      await startProxyServer(spec, auth || undefined);
    }
  } catch (err) {
    s.stop('Error');
    console.error(chalk.red(`  ✘ ${err instanceof Error ? err.message : String(err)}`));
  }
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
