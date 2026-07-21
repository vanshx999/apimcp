import SwaggerParser from '@apidevtools/swagger-parser';
import type { ParsedSpec, ToolDefinition, HttpMethod, AuthConfig, ParameterDefinition } from './types.js';

function sanitizeName(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

function operationIdToName(operationId: string, path: string, method: string): string {
  if (operationId) return sanitizeName(operationId);
  const parts = path.split('/').filter(Boolean);
  const resource = parts.map(p => p.startsWith('{') ? 'by_' + p.slice(1, -1) : p).join('_');
  return `${method}_${resource}`;
}

export async function parseOpenAPISpec(spec: Record<string, unknown>, specUrl?: string): Promise<ParsedSpec> {
  const resolved = await SwaggerParser.dereference(spec as any) as Record<string, unknown>;
  const root = resolved;
  const info = (root.info ?? {}) as Record<string, unknown>;
  const paths = (root.paths ?? {}) as Record<string, unknown>;
  const components = (root.components ?? {}) as Record<string, unknown>;
  const securitySchemes = ((components.securitySchemes ?? {}) as Record<string, unknown>);

  let serverUrl = '';
  const servers = root.servers as Array<Record<string, unknown>> | undefined;
  if (servers && servers.length > 0) {
    serverUrl = (servers[0].url as string) ?? '';
  }
  if (serverUrl.startsWith('/') && specUrl) {
    try {
      const url = new URL(specUrl);
      serverUrl = `${url.protocol}//${url.host}${serverUrl}`;
    } catch { /* ignore */ }
  }
  if (!serverUrl || serverUrl === '/') {
    serverUrl = 'http://localhost';
  }

  const globalAuth = extractGlobalAuth(root, securitySchemes);

  const tools: ToolDefinition[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      const operation = (pathItem as Record<string, unknown>)[method.toLowerCase()] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const operationId = (operation.operationId as string) ?? '';
      const description = (operation.description as string) ?? (operation.summary as string) ?? '';

      const parameters = collectParameters(operation, pathItem as Record<string, unknown>);

      const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
      let bodySchema: Record<string, unknown> | undefined;
      if (hasBody) {
        bodySchema = extractBodySchema(operation);
      }

      const auth = extractOperationAuth(operation, globalAuth);

      const name = operationIdToName(operationId, path, method.toLowerCase());

      tools.push({
        name,
        description,
        method,
        path,
        serverUrl,
        parameters,
        hasBody,
        bodySchema,
        auth,
        headers: {},
      });
    }
  }

  return {
    name: (info.title as string) ?? 'API',
    version: (info.version as string) ?? '1.0.0',
    serverUrl,
    tools,
    globalAuth,
  };
}

function extractGlobalAuth(
  root: Record<string, unknown>,
  securitySchemes: Record<string, unknown>
): AuthConfig {
  const security = root.security as Array<Record<string, string[]>> | undefined;
  if (!security || security.length === 0) return { type: 'none' };
  const firstReq = security[0];
  const schemeName = Object.keys(firstReq)[0];
  if (!schemeName) return { type: 'none' };
  const scheme = securitySchemes[schemeName] as Record<string, unknown> | undefined;
  if (!scheme) return { type: 'none' };

  const type = scheme.type as string;
  if (type === 'apiKey') {
    return {
      type: 'apiKey',
      in: (scheme.in as 'header' | 'query' | 'cookie') ?? 'header',
      name: (scheme.name as string) ?? 'X-API-Key',
    };
  }
  if (type === 'http') {
    const scheme_http = scheme.scheme as string;
    if (scheme_http === 'bearer') return { type: 'bearer' };
    if (scheme_http === 'basic') return { type: 'basic' };
  }
  if (type === 'oauth2') return { type: 'oauth2' };
  return { type: 'none' };
}

function extractOperationAuth(
  operation: Record<string, unknown>,
  globalAuth: AuthConfig
): AuthConfig {
  const secRequirements = operation.security as Array<Record<string, string[]>> | undefined;
  if (!secRequirements || secRequirements.length === 0) {
    return secRequirements === undefined ? globalAuth : { type: 'none' };
  }
  return globalAuth;
}

function collectParameters(
  operation: Record<string, unknown>,
  pathItem: Record<string, unknown>,
): ParameterDefinition[] {
  const params: ParameterDefinition[] = [];
  const allParams = [
    ...((pathItem.parameters ?? []) as Array<Record<string, unknown>>),
    ...((operation.parameters ?? []) as Array<Record<string, unknown>>),
  ];

  for (const p of allParams) {
    const schema = (p.schema ?? {}) as Record<string, unknown>;
    params.push({
      name: p.name as string,
      in: (p.in as 'path' | 'query' | 'header' | 'cookie') ?? 'query',
      required: (p.required as boolean) ?? false,
      type: (schema.type as string) ?? 'string',
      description: (p.description as string) ?? '',
    });
  }
  return params;
}

function extractBodySchema(operation: Record<string, unknown>): Record<string, unknown> | undefined {
  const requestBody = operation.requestBody as Record<string, unknown> | undefined;
  if (!requestBody) return undefined;
  const content = requestBody.content as Record<string, unknown> | undefined;
  if (!content) return undefined;
  const jsonContent = (content['application/json'] ?? content['*/*']) as Record<string, unknown> | undefined;
  if (!jsonContent) return undefined;
  return jsonContent.schema as Record<string, unknown> ?? undefined;
}
