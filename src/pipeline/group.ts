import type { ParsedSpec, ToolDefinition } from '../parser/types.js';
import type { EndpointGroup } from './types.js';

type ToolGroupingMetadata = ToolDefinition & {
  tag?: string;
  tags?: string[];
};

function resourcePathPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const resource = segments.find(segment => !segment.startsWith('{'));
  return resource ? `/${resource}` : '/';
}

function groupingKey(tool: ToolDefinition): string {
  const metadata = tool as ToolGroupingMetadata;
  const tag = metadata.tags?.[0] ?? metadata.tag;
  return tag?.trim() || resourcePathPrefix(tool.path);
}

export function groupEndpoints(parsedSpec: ParsedSpec): EndpointGroup[] {
  const groups = new Map<string, EndpointGroup>();

  for (const endpoint of parsedSpec.tools) {
    const key = groupingKey(endpoint);
    let group = groups.get(key);

    if (!group) {
      group = {
        id: key,
        name: key,
        tag: key,
        endpoints: [],
      };
      groups.set(key, group);
    }

    group.endpoints.push(endpoint);
  }

  return [...groups.values()];
}
