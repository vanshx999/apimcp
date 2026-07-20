import { Command } from 'commander';
import chalk from 'chalk';
import { serveCommand } from './serve.js';
import { generateCommand } from './generate.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let pkgVersion = '0.1.0';
try {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8')
  );
  pkgVersion = pkg.version;
} catch { /* ignore */ }

function handleError(err: unknown): void {
  console.error(chalk.red('✘') + ` Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

export function createCLI(): Command {
  const program = new Command();

  program
    .name('apimcp')
    .description(chalk.cyan('Convert any OpenAPI spec into an MCP server'))
    .version(pkgVersion);

  program
    .command('serve')
    .description('Start an MCP server from an OpenAPI spec (runtime proxy)')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .option('-a, --auth <token>', 'API token for bearer authentication')
    .action(async (spec, options) => {
      try {
        await serveCommand(spec, options);
      } catch (err) { handleError(err); }
    });

  program
    .command('generate')
    .description('Generate an MCP server from an OpenAPI spec')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .option('-l, --lang <lang>', 'Output language (ts)', 'ts')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (spec, options) => {
      try {
        await generateCommand(spec, options);
      } catch (err) { handleError(err); }
    });

  return program;
}
