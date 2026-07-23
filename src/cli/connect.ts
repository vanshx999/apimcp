import chalk from 'chalk';
import { createInterface } from 'readline';

export async function connectCommand(url: string): Promise<void> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error(chalk.red('✘') + ' URL must start with http:// or https://');
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin });
  const apiBase = url.replace(/\/+$/, '');

  console.error(chalk.dim(`\n  Bridging stdio → ${chalk.cyan(apiBase)}\n`));

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed: { id?: unknown };
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (parsed.id === undefined) {
      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: trimmed,
      }).catch(() => {});
      continue;
    }

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: trimmed,
      });
      const text = await res.text();
      if (text.trim()) {
        process.stdout.write(text + '\n');
      }
    } catch (err) {
      const errorResponse = JSON.stringify({
        jsonrpc: '2.0',
        id: parsed.id,
        error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
      });
      process.stdout.write(errorResponse + '\n');
    }
  }
}
