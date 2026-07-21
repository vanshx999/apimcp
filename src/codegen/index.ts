import type { ParsedSpec } from '../parser/types.js';
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
