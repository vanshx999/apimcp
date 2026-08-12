import type { ParsedSpec, CuratedTool } from '../parser/types.js';
import { generateTypeScript } from './typescript.js';
import { generatePython } from './python.js';

export function generateCode(spec: ParsedSpec, lang: string): Record<string, string> {
  switch (lang) {
    case 'ts':
      return generateTypeScript(spec);
    case 'py':
      return generatePython(spec);
    default:
      throw new Error(`Unsupported language: ${lang}. Use 'ts' or 'py'.`);
  }
}

export function generateCodeForTools(spec: ParsedSpec, curatedTools: CuratedTool[], lang: string): Record<string, string> {
  const selectedToolNames = new Set(
    curatedTools.filter(ct => ct.selected).map(ct => ct.name)
  );
  
  const filteredTools = spec.tools.filter(tool => selectedToolNames.has(tool.name));
  
  const filteredSpec: ParsedSpec = {
    ...spec,
    tools: filteredTools,
  };
  
  return generateCode(filteredSpec, lang);
}
