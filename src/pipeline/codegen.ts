import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ParsedSpec, CuratedTool } from '../parser/types.js';
import { generateCodeForTools } from '../codegen/index.js';

export interface CodegenOptions {
  spec: ParsedSpec;
  curatedTools: CuratedTool[];
  lang: string;
  cacheHash: string;
  onProgress?: (event: { type: string; filesGenerated: number }) => void;
}

export interface CodegenResult {
  outputDir: string;
  files: Record<string, string>;
}

export async function runCodegenPipeline(options: CodegenOptions): Promise<CodegenResult> {
  const { spec, curatedTools, lang, cacheHash, onProgress } = options;
  
  const outputDir = join(process.cwd(), '.swarm-cache', cacheHash, '04-codegen');
  mkdirSync(outputDir, { recursive: true });
  
  const files = generateCodeForTools(spec, curatedTools, lang);
  
  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, content, 'utf-8');
  }
  
  const filesGenerated = Object.keys(files).length;
  
  onProgress?.({ type: 'codegen:progress', filesGenerated });
  
  return { outputDir, files };
}