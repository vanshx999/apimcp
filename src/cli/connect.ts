import chalk from 'chalk';
import { createInterface } from 'readline';
import { createServer, connect as tcpConnect } from 'net';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DAEMON_DIR = join(homedir(), '.apimcp');
const DAEMONS_FILE = join(DAEMON_DIR, 'daemons.json');

function getDaemonPort(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return 35000 + (Math.abs(hash) % 5000);
}

function loadDaemons(): Record<string, { url: string; port: number; pid: number; started: string }> {
  try {
    return JSON.parse(readFileSync(DAEMONS_FILE, 'utf-8'));
  } catch { return {}; }
}

function saveDaemons(data: Record<string, any>): void {
  mkdirSync(DAEMON_DIR, { recursive: true });
  writeFileSync(DAEMONS_FILE, JSON.stringify(data, null, 2));
}

function isRunning(pid: number): boolean {
  try { return process.kill(pid, 0); }
  catch { return false; }
}

async function bridgeLoop(input: NodeJS.ReadableStream, output: NodeJS.WritableStream, url: string): Promise<void> {
  const apiBase = url.replace(/\/+$/, '');
  const rl = createInterface({ input });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: { id?: unknown };
    try { parsed = JSON.parse(trimmed); } catch { continue; }
    if (parsed.id === undefined) {
      fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: trimmed }).catch(() => {});
      continue;
    }
    try {
      const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: trimmed });
      const text = await res.text();
      if (text.trim()) output.write(text + '\n');
    } catch (err) {
      output.write(JSON.stringify({
        jsonrpc: '2.0', id: parsed.id,
        error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
      }) + '\n');
    }
  }
}

export async function connectCommand(url: string, options: { daemon?: string; stdio?: string; _bridge?: string }): Promise<void> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error(chalk.red('✘') + ' URL must start with http:// or https://');
    process.exit(1);
  }

  if (options._bridge) {
    const port = parseInt(options._bridge, 10);
    const server = createServer((socket) => {
      bridgeLoop(socket, socket, url).catch(() => {});
    });
    server.listen(port, '127.0.0.1', () => {
      process.stdout.write('LISTENING:' + port + '\n');
    });
    return;
  }

  if (options.stdio) {
    const daemons = loadDaemons();
    const daemon = daemons[options.stdio];
    if (!daemon || !isRunning(daemon.pid)) {
      console.error(chalk.red('✘') + ` Daemon "${options.stdio}" not found or not running. Use "apimcp ps" to check.`);
      process.exit(1);
    }
    const client = tcpConnect(daemon.port, '127.0.0.1');
    client.on('connect', () => {
      bridgeLoop(process.stdin, client, daemon.url).catch(() => {});
      client.on('data', (data) => process.stdout.write(data));
      client.on('end', () => process.exit(0));
    });
    client.on('error', (err) => {
      console.error(chalk.red('✘') + ' Connection to daemon failed: ' + err.message);
      process.exit(1);
    });
    return;
  }

  if (options.daemon) {
    const name = options.daemon;
    const port = getDaemonPort(name);
    const daemons = loadDaemons();
    const existing = daemons[name];
    if (existing && isRunning(existing.pid)) {
      console.error(chalk.yellow('⚠') + ` Daemon "${name}" already running (PID ${existing.pid}). Use "apimcp disconnect ${name}" first.`);
      console.error(chalk.dim(`  To force re-create: apimcp disconnect ${name} && apimcp connect --daemon ${name} ${url}`));
      process.exit(1);
    }
    const child = spawn(process.argv[0], process.argv.slice(1).filter(a => a !== '--daemon'), {
      env: { ...process.env, APIMCP_DAEMON: name, APIMCP_DAEMON_URL: url },
      stdio: ['ignore', 'pipe', 'inherit'],
      detached: true,
    });
    child.unref();
    let listening = false;
    child.stdout!.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg.startsWith('LISTENING:')) {
        listening = true;
        daemons[name] = { url, port, pid: child.pid!, started: new Date().toISOString() };
        saveDaemons(daemons);
        console.error(chalk.green('✔') + ` Daemon "${chalk.cyan(name)}" started (PID ${child.pid})`);
        console.error(chalk.dim(`  Remote: ${chalk.cyan(url)}`));
        console.error(chalk.dim(`  Port: ${port}`));
        console.error(chalk.dim(`  Use in claude_desktop_config.json:`));
        console.error(chalk.dim(`    "command": "apimcp", "args": ["connect", "--stdio", "${name}"]`));
      }
    });
    setTimeout(() => { if (!listening) console.error(chalk.red('✘') + ' Daemon failed to start'); }, 5000);
    return;
  }

  console.error(chalk.dim(`\n  Bridging stdio → ${chalk.cyan(url.replace(/\/+$/, ''))}\n`));
  await bridgeLoop(process.stdin, process.stdout, url);
}

export function listDaemons(): void {
  const daemons = loadDaemons();
  const names = Object.keys(daemons);
  if (names.length === 0) {
    console.log(chalk.dim('No daemons running.'));
    return;
  }
  for (const name of names) {
    const d = daemons[name];
    const alive = isRunning(d.pid);
    console.log(`  ${alive ? chalk.green('●') : chalk.red('○')} ${chalk.bold(name)}`);
    console.log(`    URL: ${chalk.cyan(d.url)}`);
    console.log(`    PID: ${d.pid}  Port: ${d.port}`);
    console.log(`    Started: ${d.started}  ${alive ? chalk.green('(running)') : chalk.red('(stopped)')}`);
    if (!alive) console.log(chalk.dim(`    To restart: apimcp connect --daemon ${name} ${d.url}`));
  }
}

export function stopDaemon(name: string): void {
  const daemons = loadDaemons();
  const d = daemons[name];
  if (!d) {
    console.error(chalk.red('✘') + ` No daemon named "${name}"`);
    process.exit(1);
  }
  if (isRunning(d.pid)) {
    try { process.kill(d.pid, 'SIGTERM'); } catch {}
    console.error(chalk.green('✔') + ` Daemon "${chalk.cyan(name)}" stopped (PID ${d.pid})`);
  } else {
    console.error(chalk.yellow('⚠') + ` Daemon "${name}" was not running (PID ${d.pid})`);
  }
  delete daemons[name];
  saveDaemons(daemons);
}
