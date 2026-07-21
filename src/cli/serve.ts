import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';

function printTools(spec: { name: string; version: string; serverUrl: string; tools: Array<{ method: string; path: string; name: string; description: string; parameters: Array<{ name: string; required: boolean }> }> }): void {
  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
    PATCH: chalk.magenta, DELETE: chalk.red,
  };

  console.error(`\n${chalk.bold(spec.name)} v${spec.version}`);
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
}

export async function serveCommand(input: string, options: { auth?: string; dryRun?: boolean }): Promise<void> {
  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = await parseOpenAPISpec(specData, input);
  printTools(spec);

  if (options.dryRun) {
    console.error(`\n${chalk.green('◉')} ${chalk.bold(String(spec.tools.length))} tools — dry run, not serving`);
    return;
  }

  console.error(`\n${chalk.green('◉')} Serving ${chalk.bold(String(spec.tools.length))} tools via stdio`);
  if (options.auth) console.error(chalk.dim('  Auth: bearer token'));
  await startProxyServer(spec, options.auth);
}
