import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadSpecFromFile, loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { generateTypeScript } from '../codegen/typescript.js';

export async function generateCommand(
  input: string,
  options: { lang?: string; output?: string }
): Promise<void> {
  const specData = input.startsWith('http://') || input.startsWith('https://')
    ? await loadSpecFromUrl(input)
    : loadSpecFromFile(input);

  const spec = await parseOpenAPISpec(specData, input);
  const safeName = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api';
  const outDir = options.output ?? `./mcp-${safeName}`;

  const lang = options.lang ?? 'ts';
  if (lang !== 'ts') {
    throw new Error(`Language '${lang}' not supported yet. Use 'ts'.`);
  }

  const files = generateTypeScript(spec);
  mkdirSync(outDir, { recursive: true });

  for (const [filename, code] of Object.entries(files)) {
    const filePath = join(outDir, filename);
    writeFileSync(filePath, code, 'utf-8');
    console.error(chalk.dim(`  ${chalk.green('✓')} ${filename}`));
  }

  console.error(`\n${chalk.green('◉')} Generated MCP server at ${chalk.bold(outDir)}`);
  console.error(`  ${chalk.cyan(String(spec.tools.length))} tools from ${chalk.bold(spec.name)} v${spec.version}`);
  console.error(`  Run: ${chalk.cyan(`cd ${outDir} && npm start`)}`);
}
