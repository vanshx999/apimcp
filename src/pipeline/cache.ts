import { createHash } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

let cacheDir: string | null = null;
let specUrlForCache: string | null = null;

function getCacheDir(specUrl?: string): string {
  if (cacheDir && (!specUrl || specUrl === specUrlForCache)) {
    return cacheDir;
  }

  if (specUrl) {
    const hash = createHash('sha256').update(specUrl).digest('hex').slice(0, 16);
    specUrlForCache = specUrl;
    cacheDir = join('.swarm-cache', hash);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  }

  throw new Error('Spec URL is required to initialize cache');
}

export function initCache(specUrl: string): string {
  return getCacheDir(specUrl);
}

export async function saveStage(stageName: string, data: unknown): Promise<void> {
  if (!cacheDir) {
    throw new Error('Cache not initialized. Call initCache(specUrl) first.');
  }
  const filePath = join(cacheDir, `${stageName}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function loadStage(stageName: string): Promise<unknown | null> {
  if (!cacheDir) {
    throw new Error('Cache not initialized. Call initCache(specUrl) first.');
  }
  const filePath = join(cacheDir, `${stageName}.json`);
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function hasCache(specUrl?: string): boolean {
  try {
    const dir = getCacheDir(specUrl);
    if (!existsSync(dir)) return false;
    const files = readdirSync(dir);
    return files.length > 0;
  } catch {
    return false;
  }
}

export async function clearCache(specUrl?: string): Promise<void> {
  try {
    const dir = getCacheDir(specUrl);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
    cacheDir = null;
    specUrlForCache = null;
  } catch {
    // Ignore errors
  }
}

export function getCachePath(): string | null {
  return cacheDir;
}

export function isReplayMode(): boolean {
  return process.argv.includes('--replay');
}