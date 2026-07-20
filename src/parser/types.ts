export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthType = 'none' | 'apiKey' | 'bearer' | 'basic' | 'oauth2';

export interface AuthConfig {
  type: AuthType;
  in?: 'header' | 'query' | 'cookie';
  name?: string;
}

export interface ParameterDefinition {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  type: string;
  description?: string;
  schema?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  serverUrl: string;
  parameters: ParameterDefinition[];
  hasBody: boolean;
  bodySchema?: Record<string, unknown>;
  auth: AuthConfig;
  headers: Record<string, string>;
}

export interface ParsedSpec {
  name: string;
  version: string;
  serverUrl: string;
  tools: ToolDefinition[];
  globalAuth: AuthConfig;
}
