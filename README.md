# apimcp

**Convert any OpenAPI spec into an MCP server. Works with the 2026-07-28 MCP spec.**

```bash
npx apimcp serve https://petstore3.swagger.io/api/v3/openapi.json
```

Your AI agent now has full access to the Petstore API. No glue code. No SDKs.

## Why

MCP (Model Context Protocol) is how AI agents call real APIs. But wiring every endpoint by hand is tedious. Almost every API already publishes an OpenAPI spec — `apimcp` reads it and generates the MCP server automatically.

## Two modes

### Proxy mode — instant setup

```bash
apimcp serve ./openapi.yaml --auth "sk-xxx"
```

Reads the spec and creates an MCP server at runtime. Each endpoint becomes a tool the agent can call. Add it to Claude Desktop / Claude Code:

```json
{
  "mcpServers": {
    "my-api": {
      "command": "apimcp",
      "args": ["serve", "./openapi.yaml", "--auth", "sk-xxx"]
    }
  }
}
```

### Codegen mode — code you own

```bash
apimcp generate https://stripe.com/openapi.json -o ./stripe-mcp
cd ./stripe-mcp && npm start
```

Generates a complete TypeScript MCP server you can modify, extend, and deploy anywhere. No runtime dependency on `apimcp`.

## Install

```bash
npm install -g apimcp
```

Or use directly:

```bash
npx apimcp serve <spec>
npx apimcp generate <spec>
```

## Usage

```bash
apimcp serve <spec>           # Start MCP server (stdio)
apimcp generate <spec>        # Generate source code
```

| Argument | Description |
|----------|-------------|
| `<spec>` | OpenAPI 3.x spec file (.json/.yaml) or URL |

| Option | Description |
|--------|-------------|
| `-a, --auth <token>` | Bearer token for API auth |
| `-o, --output <dir>` | Output directory (codegen mode) |

## Examples

```bash
# Petstore API (no auth needed)
apimcp serve https://petstore3.swagger.io/api/v3/openapi.json

# GitHub API (with token)
apimcp serve github-api.yaml --auth "ghp_xxx"

# Generate a deployable server
apimcp generate ./api-spec.yaml -o ./my-mcp-server
```

## Why apimcp?

- **Targets 2026-07-28 MCP spec** — stateless, sessionless, production-ready
- **No codegen lock-in** — generated code has zero dependency on apimcp
- **One command** — point at any spec, get a working MCP server
- **Auth-aware** — API keys, bearer, and OAuth2 built in
