import { Command } from 'commander';
import chalk from 'chalk';
import { serveCommand } from './serve.js';
import { generateCommand } from './generate.js';
import { inspectCommand } from './inspect.js';
import { demoCommand } from './demo.js';
import { discoverCommand } from './discover.js';
import { deployCommand } from './deploy.js';
import { connectCommand } from './connect.js';
import { runTUI } from './tui.js';
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
    .version(pkgVersion)
    .action(async () => {
      try {
        await runTUI();
      } catch (err) { handleError(err); }
    });

  program
    .command('serve')
    .description('Start an MCP server from an OpenAPI spec (runtime proxy)')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .option('-a, --auth <token>', 'API token for bearer authentication')
    .option('--dry-run', 'Show tools without starting server')
    .action(async (spec, options) => {
      try {
        await serveCommand(spec, options);
      } catch (err) { handleError(err); }
    });

  program
    .command('generate')
    .description('Generate an MCP server from an OpenAPI spec')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .option('-l, --lang <lang>', 'Output language (ts or py)', 'ts')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (spec, options) => {
      try {
        await generateCommand(spec, options);
      } catch (err) { handleError(err); }
    });

  program
    .command('inspect')
    .description('List all tools from an OpenAPI spec')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .action(async (spec) => {
      try {
        await inspectCommand(spec);
      } catch (err) { handleError(err); }
    });

  program
    .command('demo')
    .description('Run a demo with the Petstore API')
    .option('--serve', 'Start as MCP server')
    .action(async (options) => {
      try {
        await demoCommand(options.serve ? 'serve' : undefined);
      } catch (err) { handleError(err); }
    });

  program
    .command('discover')
    .description('Auto-discover OpenAPI spec from any website URL')
    .argument('<url>', 'Website URL or API base URL')
    .option('--serve', 'Start as MCP server after discovery')
    .option('--generate', 'Generate server code after discovery')
    .option('-l, --lang <lang>', 'Output language for --generate (ts or py)', 'ts')
    .option('-o, --output <dir>', 'Output directory for --generate')
    .option('-a, --auth <token>', 'API token for bearer authentication')
    .action(async (url, options) => {
      try {
        await discoverCommand(url, options);
      } catch (err) { handleError(err); }
    });

  program
    .command('deploy')
    .description('Deploy an MCP server to Cloudflare Workers')
    .argument('<spec>', 'OpenAPI spec path or URL (.json / .yaml)')
    .option('-n, --name <name>', 'Worker name (defaults to spec name)')
    .option('-a, --auth <token>', 'API token for bearer authentication')
    .option('--dry-run', 'Generate worker files without deploying')
    .action(async (spec, options) => {
      try {
        await deployCommand(spec, options);
      } catch (err) { handleError(err); }
    });

  program
    .command('connect')
    .description('Bridge a remote MCP server URL to local stdio')
    .argument('<url>', 'Remote MCP server URL (e.g. https://my-worker.workers.dev)')
    .action(async (url) => {
      try {
        await connectCommand(url);
      } catch (err) { handleError(err); }
    });

  return program;
}
