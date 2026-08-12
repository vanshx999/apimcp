import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

const API_BASE_URL = process.env.API_BASE_URL ?? 'https://petstore3.swagger.io/api/v3';
const API_TOKEN = process.env.API_TOKEN ?? '';

function authHeaders(): Record<string, string> { return {}; }

const server = new McpServer({
  name: 'Swagger Petstore - OpenAPI 3.0',
  version: '1.0.27',
});

server.registerTool(
  'addpet',
  {
    description: 'POST /pet — Add a new pet to the store.',
    inputSchema: z.object({
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {body} = args as {body?: Record<string, unknown>};
    let url = API_BASE_URL + '/pet';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'updatepet',
  {
    description: 'PUT /pet — Update an existing pet by Id.',
    inputSchema: z.object({
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {body} = args as {body?: Record<string, unknown>};
    let url = API_BASE_URL + '/pet';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'PUT', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'findpetsbystatus',
  {
    description: 'GET /pet/findByStatus — Multiple status values can be provided with comma separated strings.',
    inputSchema: z.object({
    status: z.string().describe('Status values that need to be considered for filter')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {status} = args as {status: string};
    let url = API_BASE_URL + '/pet/findByStatus';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

  const qs = new URLSearchParams();
  if (status !== undefined) qs.append('status', String(status));
  const qstr = qs.toString();
  url += qstr ? '?' + qstr : '';
    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'findpetsbytags',
  {
    description: 'GET /pet/findByTags — Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
    inputSchema: z.object({
    tags: z.string().describe('Tags to filter by')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {tags} = args as {tags: string};
    let url = API_BASE_URL + '/pet/findByTags';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

  const qs = new URLSearchParams();
  if (tags !== undefined) qs.append('tags', String(tags));
  const qstr = qs.toString();
  url += qstr ? '?' + qstr : '';
    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'getpetbyid',
  {
    description: 'GET /pet/{petId} — Returns a single pet.',
    inputSchema: z.object({
    petId: z.number().describe('ID of pet to return')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {petId} = args as {petId: number};
    let url = API_BASE_URL + '/pet/{petId}'.replace('{petId}', encodeURIComponent(String(petId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'updatepetwithform',
  {
    description: 'POST /pet/{petId} — Updates a pet resource based on the form data.',
    inputSchema: z.object({
    petId: z.number().describe('ID of pet that needs to be updated'),
    name: z.optional(z.string()).describe('Name of pet that needs to be updated'),
    status: z.optional(z.string()).describe('Status of pet that needs to be updated'),
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {petId, name, status, body} = args as {petId: number, name?: string, status?: string, body?: Record<string, unknown>};
    let url = API_BASE_URL + '/pet/{petId}'.replace('{petId}', encodeURIComponent(String(petId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

  const qs = new URLSearchParams();
  if (name !== undefined) qs.append('name', String(name));
  if (status !== undefined) qs.append('status', String(status));
  const qstr = qs.toString();
  url += qstr ? '?' + qstr : '';
    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'deletepet',
  {
    description: 'DELETE /pet/{petId} — Delete a pet.',
    inputSchema: z.object({
    api_key: z.optional(z.string()),
    petId: z.number().describe('Pet id to delete')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {api_key, petId} = args as {api_key?: string, petId: number};
    let url = API_BASE_URL + '/pet/{petId}'.replace('{petId}', encodeURIComponent(String(petId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };
  headers['api_key'] = String(api_key);

    const fetchOpts: RequestInit = { method: 'DELETE', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'uploadfile',
  {
    description: 'POST /pet/{petId}/uploadImage — Upload image of the pet.',
    inputSchema: z.object({
    petId: z.number().describe('ID of pet to update'),
    additionalMetadata: z.optional(z.string()).describe('Additional Metadata'),
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {petId, additionalMetadata, body} = args as {petId: number, additionalMetadata?: string, body?: Record<string, unknown>};
    let url = API_BASE_URL + '/pet/{petId}/uploadImage'.replace('{petId}', encodeURIComponent(String(petId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

  const qs = new URLSearchParams();
  if (additionalMetadata !== undefined) qs.append('additionalMetadata', String(additionalMetadata));
  const qstr = qs.toString();
  url += qstr ? '?' + qstr : '';
    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'getinventory',
  {
    description: 'GET /store/inventory — Returns a map of status codes to quantities.',
    inputSchema: z.object({}),
  },
  async (args: Record<string, unknown>) => {
    const args_ = args;
    let url = API_BASE_URL + '/store/inventory';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'placeorder',
  {
    description: 'POST /store/order — Place a new order in the store.',
    inputSchema: z.object({
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {body} = args as {body?: Record<string, unknown>};
    let url = API_BASE_URL + '/store/order';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'getorderbyid',
  {
    description: 'GET /store/order/{orderId} — For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.',
    inputSchema: z.object({
    orderId: z.number().describe('ID of order that needs to be fetched')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {orderId} = args as {orderId: number};
    let url = API_BASE_URL + '/store/order/{orderId}'.replace('{orderId}', encodeURIComponent(String(orderId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'deleteorder',
  {
    description: 'DELETE /store/order/{orderId} — For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.',
    inputSchema: z.object({
    orderId: z.number().describe('ID of the order that needs to be deleted')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {orderId} = args as {orderId: number};
    let url = API_BASE_URL + '/store/order/{orderId}'.replace('{orderId}', encodeURIComponent(String(orderId)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'DELETE', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'createuser',
  {
    description: 'POST /user — This can only be done by the logged in user.',
    inputSchema: z.object({
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {body} = args as {body?: Record<string, unknown>};
    let url = API_BASE_URL + '/user';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'createuserswithlistinput',
  {
    description: 'POST /user/createWithList — Creates list of users with given input array.',
    inputSchema: z.object({
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {body} = args as {body?: Record<string, unknown>};
    let url = API_BASE_URL + '/user/createWithList';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'POST', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'loginuser',
  {
    description: 'GET /user/login — Log into the system.',
    inputSchema: z.object({
    username: z.optional(z.string()).describe('The user name for login'),
    password: z.optional(z.string()).describe('The password for login in clear text')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {username, password} = args as {username?: string, password?: string};
    let url = API_BASE_URL + '/user/login';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

  const qs = new URLSearchParams();
  if (username !== undefined) qs.append('username', String(username));
  if (password !== undefined) qs.append('password', String(password));
  const qstr = qs.toString();
  url += qstr ? '?' + qstr : '';
    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'logoutuser',
  {
    description: 'GET /user/logout — Log user out of the system.',
    inputSchema: z.object({}),
  },
  async (args: Record<string, unknown>) => {
    const args_ = args;
    let url = API_BASE_URL + '/user/logout';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'getuserbyname',
  {
    description: 'GET /user/{username} — Get user detail based on username.',
    inputSchema: z.object({
    username: z.string().describe('The name that needs to be fetched. Use user1 for testing')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {username} = args as {username: string};
    let url = API_BASE_URL + '/user/{username}'.replace('{username}', encodeURIComponent(String(username)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'GET', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'updateuser',
  {
    description: 'PUT /user/{username} — This can only be done by the logged in user.',
    inputSchema: z.object({
    username: z.string().describe('name that need to be deleted'),
    body: z.optional(z.record(z.string(), z.unknown()))
  }),
  },
  async (args: Record<string, unknown>) => {
    const {username, body} = args as {username: string, body?: Record<string, unknown>};
    let url = API_BASE_URL + '/user/{username}'.replace('{username}', encodeURIComponent(String(username)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'PUT', headers };
  if (body) fetchOpts.body = JSON.stringify(body);

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

server.registerTool(
  'deleteuser',
  {
    description: 'DELETE /user/{username} — This can only be done by the logged in user.',
    inputSchema: z.object({
    username: z.string().describe('The name that needs to be deleted')
  }),
  },
  async (args: Record<string, unknown>) => {
    const {username} = args as {username: string};
    let url = API_BASE_URL + '/user/{username}'.replace('{username}', encodeURIComponent(String(username)));
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(),
    };

    const fetchOpts: RequestInit = { method: 'DELETE', headers };

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      if (!res.ok) return { content: [{ type: 'text', text: JSON.stringify({ error: text }, null, 2) }] };
      try { return { content: [{ type: 'text', text: JSON.stringify(JSON.parse(text), null, 2) }] }; }
      catch { return { content: [{ type: 'text', text }] }; }
    } catch (err) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  console.error('apimcp: Server started. Waiting for MCP client...');
  await server.connect(transport);
}

main().catch(console.error);
