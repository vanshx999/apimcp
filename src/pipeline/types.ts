import type { ParsedSpec, ToolDefinition } from '../parser/types.js';

export interface PipelineState {
  spec: ParsedSpec;
  groups: EndpointGroup[];
  curatedTools: CuratedTool[];
  codegenOutput: Record<string, string>;
  testResults: unknown;
  summary: string;
}

export interface EndpointGroup {
  id: string;
  name: string;
  tag: string;
  endpoints: ToolDefinition[];
  reasoning?: string;
}

export interface CuratedTool extends ToolDefinition {
  groupId: string;
  reasoning: string;
  selected: boolean;
}

export interface SwarmConfig {
  provider: 'groq';
  model?: string;
  parallelGroups?: number;
  cacheDir?: string;
}

export interface StageResult {
  stage: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
