import chalk from 'chalk';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { startProxyServer } from '../proxy/server.js';

export async function serveCommand(input: string, options: { auth?: string; port?: number }): Promise<void> {
  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = parseOpenAPISpec(specData, input);
  console.error(chalk.green('◉') + ` Serving ${chalk.bold(spec.name)} v${spec.version} (${chalk.cyan(String(spec.tools.length))} tools)`);
  console.error(chalk.dim('  Transport: stdio'));
  if (options.auth) console.error(chalk.dim('  Auth: bearer token'));
  await startProxyServer(spec, options.auth);
}
