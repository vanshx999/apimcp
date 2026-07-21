import chalk from 'chalk';
import * as clack from '@clack/prompts';
import { loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';

const DEMO_URL = 'https://petstore3.swagger.io/api/v3/openapi.json';

export async function demoCommand(mode?: string): Promise<void> {
  console.error(chalk.cyan(`
  ╔══════════════════════════════════════╗
  ║     ${chalk.bold('apimcp — Demo Mode')}     ║
  ║  ${chalk.dim('Petstore API · 19 tools')}    ║
  ╚══════════════════════════════════════╝
  `));

  const s = clack.spinner();
  s.start('Fetching Petstore spec...');
  const specData = await loadSpecFromUrl(DEMO_URL);
  const spec = await parseOpenAPISpec(specData, DEMO_URL);
  s.stop(`Loaded ${spec.name} v${spec.version} (${spec.tools.length} tools)`);

  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
    PATCH: chalk.magenta, DELETE: chalk.red,
  };

  console.error(chalk.dim(`\n  ${spec.serverUrl}\n`));
  for (const tool of spec.tools) {
    const color = methodColors[tool.method] ?? chalk.white;
    const method = color(tool.method.padEnd(6));
    const required = tool.parameters.filter(p => p.required).map(p => p.name).join(', ');
    const params = required ? chalk.dim(` <${required}>`) : '';
    const desc = tool.description ? chalk.dim(` — ${tool.description}`) : '';
    console.error(`  ${method} ${tool.path}${params}`);
    console.error(`         ${chalk.cyan(tool.name)}${desc}`);
  }

  if (mode === 'serve') {
    console.error(chalk.green(`\n  ◉ Starting demo server (19 tools via stdio)...\n`));
    await startProxyServer(spec);
    return;
  }

  console.error(`\n  ${chalk.green('◉')} ${chalk.bold('Demo ready')} — ${spec.tools.length} tools available`);
  console.error(chalk.dim(`\n  Run ${chalk.cyan('apimcp demo --serve')} to start as MCP server`));
  console.error(chalk.dim(`  Or run ${chalk.cyan('apimcp inspect <url>')} for another API\n`));
}
