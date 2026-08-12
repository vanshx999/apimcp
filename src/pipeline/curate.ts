import { ToolDefinition } from '../parser/types.js';

export interface EndpointGroup {
  id: string;
  name: string;
  description: string;
  tools: ToolDefinition[];
}

export interface CuratedTool {
  toolName: string;
  selected: boolean;
  reasoning: string;
}

export interface CurateProgressEvent {
  type: 'curate:progress';
  groupId: string;
  processed: number;
  total: number;
}

type ProgressCallback = (event: CurateProgressEvent) => void;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  return apiKey;
}

function buildPrompt(group: EndpointGroup): string {
  const toolsSummary = group.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    method: tool.method,
    path: tool.path,
    parameters: tool.parameters.map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required,
      type: p.type,
      description: p.description,
    })),
    hasBody: tool.hasBody,
  }));

  return `Given the following API endpoint group, select the most useful tools for an MCP (Model Context Protocol) server. 

Group: ${group.name}
Description: ${group.description}

Endpoints:
${JSON.stringify(toolsSummary, null, 2)}

For each endpoint, determine if it should be included as an MCP tool. Consider:
- Utility for AI agents (read operations, common write operations)
- Avoid: admin-only, destructive bulk operations, internal/debug endpoints
- Prefer: CRUD operations, search, filtering, common business actions

Return a JSON array of objects with:
- toolName: the exact name of the tool
- selected: boolean (true if useful for MCP server)
- reasoning: brief explanation of why selected or not

Output ONLY the JSON array, no additional text.`;
}

async function callGroqApi(prompt: string): Promise<CuratedTool[]> {
  const apiKey = getGroqApiKey();

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at designing MCP (Model Context Protocol) servers. Select the most useful API endpoints for AI agent consumption.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq API');
  }

  let parsed: { tools: CuratedTool[] } | CuratedTool[];
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse Groq response as JSON: ${content}`);
  }

  // Handle both array and { tools: [...] } formats
  const tools = Array.isArray(parsed) ? parsed : parsed.tools;

  if (!Array.isArray(tools)) {
    throw new Error('Unexpected response format from Groq API');
  }

  return tools as CuratedTool[];
}

export async function curateGroup(
  group: EndpointGroup,
  provider: 'groq' = 'groq',
  onProgress?: ProgressCallback
): Promise<CuratedTool[]> {
  if (provider !== 'groq') {
    throw new Error(`Unsupported provider: ${provider}. Only 'groq' is supported.`);
  }

  const prompt = buildPrompt(group);

  // Emit initial progress
  onProgress?.({
    type: 'curate:progress',
    groupId: group.id,
    processed: 0,
    total: group.tools.length,
  });

  const result = await callGroqApi(prompt);

  // Emit completion progress
  onProgress?.({
    type: 'curate:progress',
    groupId: group.id,
    processed: group.tools.length,
    total: group.tools.length,
  });

  return result;
}

export async function curateGroups(
  groups: EndpointGroup[],
  provider: 'groq' = 'groq',
  onProgress?: ProgressCallback,
  concurrency = 3
): Promise<CuratedTool[][]> {
  const results: CuratedTool[][] = [];

  // Process groups in batches of concurrency
  for (let i = 0; i < groups.length; i += concurrency) {
    const batch = groups.slice(i, i + concurrency);

    const batchPromises = batch.map((group) =>
      curateGroup(group, provider, onProgress)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}