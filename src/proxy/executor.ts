import type { ToolDefinition } from '../parser/types.js';

export interface ExecuteOptions {
  tool: ToolDefinition;
  args: Record<string, unknown>;
  authToken?: string;
}

export async function executeToolCall(options: ExecuteOptions): Promise<string> {
  const { tool, args, authToken } = options;
  let url = tool.serverUrl + resolvePath(tool.path, args);
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return JSON.stringify({ error: `Failed to parse URL from ${url}` });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...tool.headers,
  };

  if (authToken && tool.auth.type === 'bearer') {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else if (authToken && tool.auth.type === 'apiKey' && tool.auth.in === 'header') {
    headers[tool.auth.name ?? 'X-API-Key'] = authToken;
  }

  const queryParams = new URLSearchParams();
  const bodyParams: Record<string, unknown> = {};

  for (const param of tool.parameters) {
    const val = args[param.name];
    if (val === undefined || val === null) {
      if (param.required) {
        return JSON.stringify({ error: `Missing required parameter: ${param.name}` });
      }
      continue;
    }

    if (param.in === 'query') {
      queryParams.append(param.name, String(val));
    } else if (param.in === 'header') {
      headers[param.name] = String(val);
    } else if (param.in === 'cookie') {
      headers['Cookie'] = `${param.name}=${encodeURIComponent(String(val))}`;
    }
  }

  if (tool.auth.type === 'apiKey' && tool.auth.in === 'query') {
    queryParams.append(tool.auth.name ?? 'api_key', authToken ?? '');
  }

  const qs = queryParams.toString();
  if (qs) url += (url.includes('?') ? '&' : '?') + qs;

  const bodyArg = args['body'] ?? args['requestBody'];
  const bodyData = bodyArg ?? bodyParams;

  const fetchOptions: RequestInit = {
    method: tool.method,
    headers,
  };

  if (tool.hasBody && bodyData && typeof bodyData === 'object') {
    fetchOptions.body = JSON.stringify(bodyData);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') ?? '';
    let text = await response.text();

    if (!response.ok) {
      return JSON.stringify({
        error: `HTTP ${response.status}: ${response.statusText}`,
        body: text,
      }, null, 2);
    }

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return text;
      }
    }
    return text;
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function resolvePath(path: string, args: Record<string, unknown>): string {
  return path.replace(/\{(\w+)\}/g, (_, name) => {
    const val = args[name];
    if (val === undefined || val === null) return `{${name}}`;
    return encodeURIComponent(String(val));
  });
}
