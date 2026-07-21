import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';
import chalk from 'chalk';
import type { ParsedSpec, ToolDefinition, ParameterDefinition } from '../parser/types.js';
import { executeToolCall } from './executor.js';

function parameterToZod(param: ParameterDefinition): z.ZodType {
  let schema: z.ZodType;
  switch (param.type) {
    case 'integer': schema = z.number(); break;
    case 'number': schema = z.number(); break;
    case 'boolean': schema = z.boolean(); break;
    case 'array': schema = z.array(z.unknown()); break;
    default: schema = z.string(); break;
  }
  if (!param.required) {
    const desc = param.description ? ` (${param.description})` : '';
    return z.optional(schema.describe(param.name + desc));
  }
  if (param.description) {
    schema = schema.describe(param.description);
  }
  return schema;
}

function buildInputSchema(tool: ToolDefinition): Record<string, z.ZodType> {
  const shape: Record<string, z.ZodType> = {};
  for (const param of tool.parameters) {
    shape[param.name] = parameterToZod(param);
  }
  if (tool.hasBody && tool.bodySchema) {
    shape['body'] = z.optional(z.record(z.string(), z.unknown()));
  }
  return shape;
}

const methodColors: Record<string, (s: string) => string> = {
  GET: chalk.green, POST: chalk.blue, PUT: chalk.yellow,
  PATCH: chalk.magenta, DELETE: chalk.red,
};

export function createProxyServer(spec: ParsedSpec, authToken?: string): McpServer {
  const server = new McpServer({
    name: spec.name,
    version: spec.version,
  });

  for (const tool of spec.tools) {
    const shape = buildInputSchema(tool);
    server.registerTool(
      tool.name,
      {
        description: `${tool.method} ${tool.path}${tool.description ? ` — ${tool.description}` : ''}`,
        inputSchema: shape,
      },
      async (args: Record<string, unknown>) => {
        const start = Date.now();
        const methodColor = methodColors[tool.method] ?? chalk.white;
        const argStr = Object.entries(args)
          .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(', ');
        console.error(chalk.dim(`  ${methodColor(tool.method)} ${tool.path} ${argStr ? chalk.cyan(`<${argStr}>`) : ''}`));

        const result = await executeToolCall({ tool, args, authToken });

        const ms = Date.now() - start;
        const statusColor = result.length < 100 && result.includes('error') ? chalk.red : chalk.green;
        console.error(chalk.dim(`    ${statusColor('✓')} ${ms}ms · ${result.length}b`));

        return {
          content: [{ type: 'text' as const, text: result }],
        };
      }
    );
  }

  return server;
}

export async function startProxyServer(spec: ParsedSpec, authToken?: string): Promise<void> {
  const server = createProxyServer(spec, authToken);
  const transport = new StdioServerTransport();
  console.error(chalk.dim(`\n  Listening for MCP client connections...\n`));
  await server.connect(transport);
}
