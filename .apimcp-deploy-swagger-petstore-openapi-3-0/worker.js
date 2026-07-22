const SPEC = {
  "tools": [
    {
      "name": "addpet",
      "method": "POST",
      "path": "/pet",
      "description": "Add a new pet to the store.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "updatepet",
      "method": "PUT",
      "path": "/pet",
      "description": "Update an existing pet by Id.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "findpetsbystatus",
      "method": "GET",
      "path": "/pet/findByStatus",
      "description": "Multiple status values can be provided with comma separated strings.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "description": "Status values that need to be considered for filter"
          }
        },
        "required": [
          "status"
        ]
      }
    },
    {
      "name": "findpetsbytags",
      "method": "GET",
      "path": "/pet/findByTags",
      "description": "Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tags": {
            "type": "array",
            "description": "Tags to filter by"
          }
        },
        "required": [
          "tags"
        ]
      }
    },
    {
      "name": "getpetbyid",
      "method": "GET",
      "path": "/pet/{petId}",
      "description": "Returns a single pet.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "petId": {
            "type": "integer",
            "description": "ID of pet to return"
          }
        },
        "required": [
          "petId"
        ]
      }
    },
    {
      "name": "updatepetwithform",
      "method": "POST",
      "path": "/pet/{petId}",
      "description": "Updates a pet resource based on the form data.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "petId": {
            "type": "integer",
            "description": "ID of pet that needs to be updated"
          },
          "name": {
            "type": "string",
            "description": "Name of pet that needs to be updated"
          },
          "status": {
            "type": "string",
            "description": "Status of pet that needs to be updated"
          }
        },
        "required": [
          "petId"
        ]
      }
    },
    {
      "name": "deletepet",
      "method": "DELETE",
      "path": "/pet/{petId}",
      "description": "Delete a pet.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "api_key": {
            "type": "string",
            "description": ""
          },
          "petId": {
            "type": "integer",
            "description": "Pet id to delete"
          }
        },
        "required": [
          "petId"
        ]
      }
    },
    {
      "name": "uploadfile",
      "method": "POST",
      "path": "/pet/{petId}/uploadImage",
      "description": "Upload image of the pet.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "petId": {
            "type": "integer",
            "description": "ID of pet to update"
          },
          "additionalMetadata": {
            "type": "string",
            "description": "Additional Metadata"
          }
        },
        "required": [
          "petId"
        ]
      }
    },
    {
      "name": "getinventory",
      "method": "GET",
      "path": "/store/inventory",
      "description": "Returns a map of status codes to quantities.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "placeorder",
      "method": "POST",
      "path": "/store/order",
      "description": "Place a new order in the store.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "getorderbyid",
      "method": "GET",
      "path": "/store/order/{orderId}",
      "description": "For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "orderId": {
            "type": "integer",
            "description": "ID of order that needs to be fetched"
          }
        },
        "required": [
          "orderId"
        ]
      }
    },
    {
      "name": "deleteorder",
      "method": "DELETE",
      "path": "/store/order/{orderId}",
      "description": "For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "orderId": {
            "type": "integer",
            "description": "ID of the order that needs to be deleted"
          }
        },
        "required": [
          "orderId"
        ]
      }
    },
    {
      "name": "createuser",
      "method": "POST",
      "path": "/user",
      "description": "This can only be done by the logged in user.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "createuserswithlistinput",
      "method": "POST",
      "path": "/user/createWithList",
      "description": "Creates list of users with given input array.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "loginuser",
      "method": "GET",
      "path": "/user/login",
      "description": "Log into the system.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "description": "The user name for login"
          },
          "password": {
            "type": "string",
            "description": "The password for login in clear text"
          }
        },
        "required": []
      }
    },
    {
      "name": "logoutuser",
      "method": "GET",
      "path": "/user/logout",
      "description": "Log user out of the system.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "getuserbyname",
      "method": "GET",
      "path": "/user/{username}",
      "description": "Get user detail based on username.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "description": "The name that needs to be fetched. Use user1 for testing"
          }
        },
        "required": [
          "username"
        ]
      }
    },
    {
      "name": "updateuser",
      "method": "PUT",
      "path": "/user/{username}",
      "description": "This can only be done by the logged in user.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "description": "name that need to be deleted"
          }
        },
        "required": [
          "username"
        ]
      }
    },
    {
      "name": "deleteuser",
      "method": "DELETE",
      "path": "/user/{username}",
      "description": "This can only be done by the logged in user.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "username": {
            "type": "string",
            "description": "The name that needs to be deleted"
          }
        },
        "required": [
          "username"
        ]
      }
    }
  ],
  "servers": "https://petstore3.swagger.io/api/v3"
};

function resolveUrl(path) {
  const base = SPEC.servers.replace(/\/+$/, '');
  return base + path;
}

async function executeTool(name, args) {
  const tool = SPEC.tools.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  const { method, path: pattern } = tool;
  let path = pattern;
  const query = new URLSearchParams();
  let body;

  for (const key of Object.keys(args || {})) {
    if (path.includes(`{${key}}`)) {
      path = path.replace(`{${key}}`, encodeURIComponent(String(args[key])));
    } else if (key === 'body') {
      body = typeof args.body === 'string' ? args.body : JSON.stringify(args.body);
    } else {
      query.set(key, String(args[key]));
    }
  }

  const url = resolveUrl(path) + (query.toString() ? '?' + query.toString() : '');

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'apimcp-worker/1.0',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method !== 'GET' && method !== 'HEAD' && body ? body : undefined,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'GET' || (request.method === 'POST' && url.pathname === '/tools')) {
      const toolList = SPEC.tools.map(t => ({
        name: t.name,
        description: t.description ? `${t.method} ${t.path} — ${t.description}` : `${t.method} ${t.path}`,
        inputSchema: t.inputSchema,
      }));
      return new Response(JSON.stringify({
        name: "Swagger Petstore - OpenAPI 3.0",
        version: "1.0.27",
        tools: toolList,
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method === 'POST') {
      try {
        const { name, arguments: args } = await request.json();
        if (!name) throw new Error('Missing "name" field');
        const result = await executeTool(name, args || {});
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    return new Response('Not found. Use GET / for tools list, POST / to call a tool.', { status: 404 });
  },
};