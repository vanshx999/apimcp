import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';

export async function inspectCommand(input: string): Promise<void> {
  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = await parseOpenAPISpec(specData, input);

  console.error(`\n${chalk.bold(spec.name)} v${spec.version}`);
  console.error(chalk.dim(`  Server: ${spec.serverUrl}`));
  console.error(chalk.dim(`  Auth: ${spec.globalAuth.type}`));
  console.error('');

  const methodColors: Record<string, (s: string) => string> = {
    GET: chalk.green,
    POST: chalk.blue,
    PUT: chalk.yellow,
    PATCH: chalk.magenta,
    DELETE: chalk.red,
  };

  for (const tool of spec.tools) {
    const color = methodColors[tool.method] ?? chalk.white;
    const method = color(tool.method.padEnd(6));
    const params = tool.parameters.filter(p => p.required).map(p => p.name).join(', ');
    const paramStr = params ? chalk.dim(` <${params}>`) : '';
    console.error(`  ${method} ${tool.path}${paramStr}`);
    console.error(`         ${chalk.cyan(tool.name)}${tool.description ? chalk.dim(` — ${tool.description}`) : ''}`);
  }

  console.error(`\n${chalk.green('◉')} ${chalk.bold(String(spec.tools.length))} tools total`);
}
