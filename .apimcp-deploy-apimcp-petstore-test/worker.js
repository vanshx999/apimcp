const SPEC = {
  "tools": [
    {
      "name": "addpet",
      "description": "POST /pet — Add a new pet to the store.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "updatepet",
      "description": "PUT /pet — Update an existing pet by Id.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "findpetsbystatus",
      "description": "GET /pet/findByStatus — Multiple status values can be provided with comma separated strings.",
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
      "description": "GET /pet/findByTags — Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.",
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
      "description": "GET /pet/{petId} — Returns a single pet.",
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
      "description": "POST /pet/{petId} — Updates a pet resource based on the form data.",
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
      "description": "DELETE /pet/{petId} — Delete a pet.",
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
      "description": "POST /pet/{petId}/uploadImage — Upload image of the pet.",
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
      "description": "GET /store/inventory — Returns a map of status codes to quantities.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "placeorder",
      "description": "POST /store/order — Place a new order in the store.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "getorderbyid",
      "description": "GET /store/order/{orderId} — For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.",
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
      "description": "DELETE /store/order/{orderId} — For valid response try integer IDs with value < 1000. Anything above 1000 or non-integers will generate API errors.",
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
      "description": "POST /user — This can only be done by the logged in user.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "createuserswithlistinput",
      "description": "POST /user/createWithList — Creates list of users with given input array.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "loginuser",
      "description": "GET /user/login — Log into the system.",
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
      "description": "GET /user/logout — Log user out of the system.",
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": []
      }
    },
    {
      "name": "getuserbyname",
      "description": "GET /user/{username} — Get user detail based on username.",
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
      "description": "PUT /user/{username} — This can only be done by the logged in user.",
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
      "description": "DELETE /user/{username} — This can only be done by the logged in user.",
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

  const [method, pathPattern] = tool.description.split(' ');
  let path = pathPattern;

  const query = new URLSearchParams();
  const headers = {};

  for (const key of Object.keys(args)) {
    const param = tool.inputSchema.properties[key];
    if (!param) continue;

    if (path.includes(`{${key}}`)) {
      path = path.replace(`{${key}}`, encodeURIComponent(String(args[key])));
    } else {
      query.set(key, String(args[key]));
    }
  }

  const url = resolveUrl(path) + (query.toString() ? '?' + query.toString() : '');
  const body = args.body ? JSON.stringify(args.body) : undefined;

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body,
  });

  const text = await res.text();
  return { status: res.status, body: text };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/health' || request.method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({
        name: "Swagger Petstore - OpenAPI 3.0",
        version: "1.0.27",
        tools: SPEC.tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method === 'POST') {
      try {
        const { name, arguments: args } = await request.json();
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

    return new Response('Not found', { status: 404 });
  },
};