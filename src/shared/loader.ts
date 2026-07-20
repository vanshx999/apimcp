import { readFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';

export async function loadSpecFromUrl(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch spec: HTTP ${res.status}`);
  const text = await res.text();
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('yaml') || contentType.includes('yml')) {
    const doc = loadYaml(text);
    if (typeof doc !== 'object' || doc === null) throw new Error('Invalid YAML spec from URL');
    return doc as Record<string, unknown>;
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const doc = loadYaml(text);
    if (typeof doc !== 'object' || doc === null) throw new Error('Could not parse spec from URL');
    return doc as Record<string, unknown>;
  }
}

export function loadSpecFromFile(input: string): Record<string, unknown> {
  const content = readFileSync(input, 'utf-8');

  if (input.endsWith('.yaml') || input.endsWith('.yml')) {
    const doc = loadYaml(content);
    if (typeof doc !== 'object' || doc === null) {
      throw new Error('Invalid YAML spec');
    }
    return doc as Record<string, unknown>;
  }

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const doc = loadYaml(content);
    if (typeof doc !== 'object' || doc === null) {
      throw new Error('Could not parse spec as JSON or YAML');
    }
    return doc as Record<string, unknown>;
  }
}

export function loadSpec(input: string): Record<string, unknown> {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    throw new Error('For URL specs, use: apimcp serve <url>');
  }
  return loadSpecFromFile(input);
}
