import type { ParsedSpec, ToolDefinition } from '../parser/types.js';
import { loadSpecFromUrl } from '../shared/loader.js';
import { parseOpenAPISpec } from '../parser/openapi.js';
import { generateCode } from '../codegen/index.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', '.cache', 'swarm');

export interface SwarmConfig {
  replay?: boolean;
  provider?: 'groq';
  outputDir?: string;
  lang?: 'ts' | 'py';
}

export interface SwarmEvent {
  type: 'stage_start' | 'stage_complete' | 'stage_error' | 'progress' | 'info';
  stage?: string;
  message?: string;
  progress?: number;
  error?: string;
  data?: unknown;
}

export type EventCallback = (event: SwarmEvent) => void;

interface StageCache<T> {
  hasCache(stage: string): boolean;
  loadStage<T>(stage: string): T | null;
  saveStage<T>(stage: string, data: T): void;
}

function createCache(): StageCache<unknown> {
  return {
    hasCache(stage: string): boolean {
      const cacheFile = join(CACHE_DIR, `${stage}.json`);
      return existsSync(cacheFile);
    },
    loadStage<T>(stage: string): T | null {
      const cacheFile = join(CACHE_DIR, `${stage}.json`);
      if (!existsSync(cacheFile)) return null;
      try {
        const content = readFileSync(cacheFile, 'utf-8');
        return JSON.parse(content) as T;
      } catch {
        return null;
      }
    },
    saveStage<T>(stage: string, data: T): void {
      if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
      }
      const cacheFile = join(CACHE_DIR, `${stage}.json`);
      writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    }
  };
}

function emit(eventCallback: EventCallback | undefined, event: SwarmEvent): void {
  if (eventCallback) {
    eventCallback(event);
  }
}

async function runStage<T>(
  stageName: string,
  fn: () => Promise<T>,
  eventCallback: EventCallback | undefined,
  cache: StageCache<unknown>,
  config: SwarmConfig
): Promise<T> {
  emit(eventCallback, { type: 'stage_start', stage: stageName, message: `Starting ${stageName}...` });

  if (config.replay && cache.hasCache(stageName)) {
    emit(eventCallback, { type: 'info', stage: stageName, message: `Loading ${stageName} from cache...` });
    const cached = cache.loadStage<T>(stageName);
    if (cached !== null) {
      emit(eventCallback, { type: 'stage_complete', stage: stageName, message: `${stageName} loaded from cache` });
      return cached;
    }
  }

  try {
    const result = await fn();
    cache.saveStage(stageName, result);
    emit(eventCallback, { type: 'stage_complete', stage: stageName, message: `${stageName} completed` });
    return result;
  } catch (error) {
    emit(eventCallback, { type: 'stage_error', stage: stageName, error: String(error) });
    throw error;
  }
}

function groupToolsByTag(tools: ToolDefinition[]): Record<string, ToolDefinition[]> {
  const groups: Record<string, ToolDefinition[]> = {};
  for (const tool of tools) {
    const pathParts = tool.path.split('/').filter(Boolean);
    const tag = pathParts[0] ?? 'default';
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(tool);
  }
  return groups;
}

async function curateTools(groups: Record<string, ToolDefinition[]>): Promise<Record<string, ToolDefinition[]>> {
  const curated: Record<string, ToolDefinition[]> = {};
  for (const [tag, tools] of Object.entries(groups)) {
    const uniqueTools = tools.filter((tool, idx, arr) =>
      arr.findIndex(t => t.name === tool.name) === idx
    );
    curated[tag] = uniqueTools;
  }
  return curated;
}

async function synthesizeOutput(
  spec: ParsedSpec,
  curatedGroups: Record<string, ToolDefinition[]>,
  generatedFiles: Record<string, string>,
  outputDir: string,
  lang: 'ts' | 'py'
): Promise<string> {
  const finalOutputDir = outputDir || join(process.cwd(), 'output', `${spec.name}-${Date.now()}`);
  
  if (!existsSync(finalOutputDir)) {
    mkdirSync(finalOutputDir, { recursive: true });
  }

  for (const [filename, content] of Object.entries(generatedFiles)) {
    const filePath = join(finalOutputDir, filename);
    const fileDir = dirname(filePath);
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }
    writeFileSync(filePath, content);
  }

  const summary = {
    name: spec.name,
    version: spec.version,
    serverUrl: spec.serverUrl,
    toolCount: spec.tools.length,
    groups: Object.keys(curatedGroups),
    files: Object.keys(generatedFiles),
    outputDir: finalOutputDir,
    generatedAt: new Date().toISOString(),
  };

  const summaryPath = join(finalOutputDir, 'swarm-summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  return finalOutputDir;
}

export async function runSwarm(
  specUrl: string,
  config: SwarmConfig = {},
  eventCallback?: EventCallback
): Promise<string> {
  const cache = createCache();
  const { replay = false, provider, outputDir, lang = 'ts' } = config;

  if (replay && !existsSync(CACHE_DIR)) {
    throw new Error('No cache found for --replay mode. Run without --replay first.');
  }

  let spec: ParsedSpec;

  spec = await runStage('parse', async () => {
    emit(eventCallback, { type: 'info', stage: 'parse', message: `Fetching spec from ${specUrl}` });
    const rawSpec = await loadSpecFromUrl(specUrl);
    return parseOpenAPISpec(rawSpec, specUrl);
  }, eventCallback, cache, config);

  const groups = await runStage('group', async () => {
    emit(eventCallback, { type: 'info', stage: 'group', message: `Grouping ${spec.tools.length} tools...` });
    return groupToolsByTag(spec.tools);
  }, eventCallback, cache, config);

  const curatedGroups = await runStage('curate', async () => {
    emit(eventCallback, { type: 'info', stage: 'curate', message: 'Curating tool groups...' });
    return curateTools(groups);
  }, eventCallback, cache, config);

  const generatedFiles = await runStage('codegen', async () => {
    emit(eventCallback, { type: 'info', stage: 'codegen', message: `Generating ${lang} code...` });
    return generateCode(spec, lang);
  }, eventCallback, cache, config);

  await runStage('test', async () => {
    emit(eventCallback, { type: 'info', stage: 'test', message: 'Running validation tests...' });
    await validateGeneratedCode(generatedFiles, lang);
  }, eventCallback, cache, config);

  const finalOutput = await runStage('synthesize', async () => {
    emit(eventCallback, { type: 'info', stage: 'synthesize', message: 'Synthesizing final output...' });
    return synthesizeOutput(spec, curatedGroups, generatedFiles, outputDir || '', lang);
  }, eventCallback, cache, config);

  emit(eventCallback, { type: 'info', stage: 'complete', message: `Swarm completed. Output: ${finalOutput}` });
  return finalOutput;
}

async function validateGeneratedCode(files: Record<string, string>, lang: 'ts' | 'py'): Promise<void> {
  if (lang === 'ts') {
    if (!files['server.ts']) throw new Error('Missing server.ts');
    if (!files['package.json']) throw new Error('Missing package.json');
    if (!files['tsconfig.json']) throw new Error('Missing tsconfig.json');
  } else {
    if (!files['server.py']) throw new Error('Missing server.py');
    if (!files['requirements.txt']) throw new Error('Missing requirements.txt');
  }
}

export function clearCache(): void {
  if (existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true, force: true });
  }
}

export function getCacheDir(): string {
  return CACHE_DIR;
}