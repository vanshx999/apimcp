import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { globSync } from 'glob';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface CuratedTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface TestResult {
  toolName: string;
  passed: boolean;
  response?: unknown;
  error?: string;
}

export interface TestProgress {
  type: 'test:progress';
  toolName: string;
  status: 'starting' | 'calling' | 'completed' | 'failed';
}

type ProgressCallback = (progress: TestProgress) => void;

function findServerCodegenDir(cacheDir: string): string | null {
  const pattern = join(cacheDir, '**', '04-codegen', 'server.ts');
  const matches = globSync(pattern);
  return matches.length > 0 ? dirname(matches[0]) : null;
}

function createTimeoutPromise<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([promise, createTimeoutPromise<T>(ms, message)]);
}

export async function testGeneratedServer(
  cacheDir: string,
  curatedTools: CuratedTool[],
  onProgress?: ProgressCallback
): Promise<{ passed: boolean; results: TestResult[] }> {
  const codegenDir = findServerCodegenDir(cacheDir);
  
  if (!codegenDir) {
    return {
      passed: false,
      results: [{
        toolName: 'server',
        passed: false,
        error: `No generated server found in ${cacheDir}/**/04-codegen/server.ts`
      }]
    };
  }

  const serverPath = join(codegenDir, 'server.ts');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    cwd: codegenDir,
    stderr: 'pipe',
  });

  const client = new Client({
    name: 'apimcp-test-client',
    version: '1.0.0',
  });

  const results: TestResult[] = [];
  let overallPassed = true;

  const emitProgress = (toolName: string, status: TestProgress['status']) => {
    onProgress?.({ type: 'test:progress', toolName, status });
  };

  try {
    emitProgress('server', 'starting');
    
    await withTimeout(
      client.connect(transport),
      30000,
      'Server spawn and connection timeout (30s)'
    );

    emitProgress('server', 'completed');

    const toolsToTest = curatedTools.slice(0, 2);

    for (const tool of toolsToTest) {
      emitProgress(tool.name, 'starting');
      emitProgress(tool.name, 'calling');

      try {
        const result = await withTimeout(
          client.callTool({
            name: tool.name,
            arguments: {},
          }),
          25000,
          `Tool ${tool.name} call timeout (25s)`
        );

        emitProgress(tool.name, 'completed');

        results.push({
          toolName: tool.name,
          passed: true,
          response: result,
        });
      } catch (error) {
        emitProgress(tool.name, 'failed');

        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          toolName: tool.name,
          passed: false,
          error: errorMessage,
        });
        overallPassed = false;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      toolName: 'server',
      passed: false,
      error: `Server connection failed: ${errorMessage}`,
    });
    overallPassed = false;
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }

  return { passed: overallPassed, results };
}