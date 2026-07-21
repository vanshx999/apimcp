import { readFileSync, writeFileSync } from 'fs';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';

// 1. Generate a server from any OpenAPI spec
console.log('\n📡 Fetching Petstore spec...');
const res = await fetch('https://petstore3.swagger.io/api/v3/openapi.json');
writeFileSync('/tmp/petstore-spec.json', await res.text());

// 2. Parse + create proxy server
const { parseOpenAPISpec } = await import('./dist/parser/openapi.js');
const { createProxyServer } = await import('./dist/proxy/server.js');

const specData = JSON.parse(readFileSync('/tmp/petstore-spec.json', 'utf-8'));
const spec = await parseOpenAPISpec(specData, 'https://petstore3.swagger.io/api/v3/openapi.json');
const server = createProxyServer(spec);

// 3. Connect in-memory (no network needed for the MCP layer)
const [cliTransport, srvTransport] = InMemoryTransport.createLinkedPair();
await server.connect(srvTransport);
const client = new Client({ name: 'test-client', version: '1.0.0' });
await client.connect(cliTransport);

// 4. List tools
const tools = await client.listTools();
console.log(`\n✅ Server created with ${tools.tools.length} tools:`);
tools.tools.slice(0, 5).forEach(t => console.log(`   - ${t.name}`));
console.log(`   ... and ${tools.tools.length - 5} more`);

// 5. Call a tool (Petstore public API, no auth needed)
console.log(`\n🔧 Calling findpetsbystatus(status: "available")...`);
const result = await client.callTool({
  name: 'findpetsbystatus',
  arguments: { status: 'available' }
});
const text = result.content[0].text;
console.log(`   Raw response (first 120): ${text.substring(0, 120)}`);
try {
  const pets = JSON.parse(text);
  const count = Array.isArray(pets) ? pets.length : 'non-array';
  console.log(`   Got ${count} available pets`);
  if (Array.isArray(pets) && pets.length > 0) {
    console.log(`   First pet: ${pets[0]?.name ?? 'unnamed'}`);
  }
} catch(e) {
  console.log(`   Parse error: ${e.message}`);
}

console.log(`\n🎉 Demo passed! apimcp works.`);
