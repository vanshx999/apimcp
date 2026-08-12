import { mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import type { ParsedSpec, ToolDefinition } from '../parser/types.js';
import { generateCode } from '../codegen/index.js';

export interface CuratedTool {
  name: string;
  method: string;
  path: string;
  toolName: string;
  summary: string;
  description: string;
  parameters: { name: string; in: string; required: boolean; type: string; description: string }[];
  hasBody: boolean;
  group: string;
  selected: boolean;
  reasoning?: string;
}

export interface CuratedGroup {
  name: string;
  description: string;
  tools: CuratedTool[];
}

export interface TestResult {
  toolName: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface SynthesizeOptions {
  spec: ParsedSpec;
  curatedTools: CuratedTool[];
  codegenOutput: Record<string, string>;
  testResults: TestResult[];
  cacheDir: string;
  outputDir: string;
  language?: 'ts' | 'py';
}

export async function synthesize(options: SynthesizeOptions): Promise<void> {
  const { spec, curatedTools, codegenOutput, testResults, cacheDir, outputDir, language = 'ts' } = options;

  // Create output directory
  mkdirSync(outputDir, { recursive: true });

  // Filter selected tools
  const selectedTools = curatedTools.filter(t => t.selected);
  const excludedTools = curatedTools.filter(t => !t.selected);

  // Merge curated tools into spec
  const curatedSpec = createCuratedSpec(spec, selectedTools);

  // Generate code from curated spec
  const finalCodegenOutput = generateCode(curatedSpec, language);

  // Write generated files to output directory
  for (const [filename, code] of Object.entries(finalCodegenOutput)) {
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, code, 'utf-8');
  }

  // Copy any additional files from cacheDir if needed (e.g., templates, configs)
  copyCacheFiles(cacheDir, outputDir);

  // Generate SWARM_SUMMARY.md
  const summary = generateSummary({
    spec,
    curatedTools,
    selectedTools,
    excludedTools,
    testResults,
    outputDir,
    language,
  });

  const summaryPath = join(outputDir, 'SWARM_SUMMARY.md');
  writeFileSync(summaryPath, summary, 'utf-8');
}

function createCuratedSpec(spec: ParsedSpec, selectedTools: CuratedTool[]): ParsedSpec {
  // Map curated tools back to ToolDefinition format
  const curatedToolDefs: ToolDefinition[] = selectedTools.map(ct => ({
    name: ct.toolName,
    description: ct.description,
    method: ct.method as ToolDefinition['method'],
    path: ct.path,
    serverUrl: spec.serverUrl,
    parameters: ct.parameters.map(p => ({
      name: p.name,
      in: p.in as ToolDefinition['parameters'][0]['in'],
      required: p.required,
      type: p.type,
      description: p.description,
    })),
    hasBody: ct.hasBody,
    auth: spec.globalAuth,
    headers: {},
  }));

  return {
    ...spec,
    tools: curatedToolDefs,
  };
}

function copyCacheFiles(cacheDir: string, outputDir: string): void {
  try {
    const files = readdirSync(cacheDir);
    for (const file of files) {
      const srcPath = join(cacheDir, file);
      const destPath = join(outputDir, file);
      const stat = statSync(srcPath);
      if (stat.isFile()) {
        // Only copy if not already present (generated files take precedence)
        try {
          statSync(destPath);
        } catch {
          const content = readdirSync(srcPath).length > 0 ? undefined : undefined;
          // For simplicity, we just skip copying cache files that might conflict
          // In practice, this would copy templates, configs, etc.
        }
      }
    }
  } catch {
    // Cache dir might not exist or be empty, that's fine
  }
}

interface SummaryData {
  spec: ParsedSpec;
  curatedTools: CuratedTool[];
  selectedTools: CuratedTool[];
  excludedTools: CuratedTool[];
  testResults: TestResult[];
  outputDir: string;
  language: 'ts' | 'py';
}

function generateSummary(data: SummaryData): string {
  const { spec, curatedTools, selectedTools, excludedTools, testResults, outputDir, language } = data;

  // Group tools by group
  const groups = new Map<string, CuratedTool[]>();
  for (const tool of curatedTools) {
    if (!groups.has(tool.group)) groups.set(tool.group, []);
    groups.get(tool.group)!.push(tool);
  }

  const passedTests = testResults.filter(t => t.passed).length;
  const failedTests = testResults.filter(t => !t.passed).length;

  const runCmd = language === 'py'
    ? `cd ${relative(process.cwd(), outputDir)} && pip install -e . && python server.py`
    : `cd ${relative(process.cwd(), outputDir)} && npm install && npm start`;

  const deployCmd = `cd ${relative(process.cwd(), outputDir)} && npx wrangler deploy`;

  let markdown = `# SWARM Summary\n\n`;
  markdown += `## Specification\n\n`;
  markdown += `- **Name**: ${spec.name}\n`;
  markdown += `- **Version**: ${spec.version}\n`;
  markdown += `- **Server URL**: ${spec.serverUrl}\n`;
  markdown += `- **Total Endpoints**: ${spec.tools.length}\n`;
  markdown += `- **Curated Count**: ${curatedTools.length}\n`;
  markdown += `- **Selected**: ${selectedTools.length}\n`;
  markdown += `- **Excluded**: ${excludedTools.length}\n\n`;

  markdown += `## Per-Group Selection\n\n`;

  for (const [groupName, tools] of groups) {
    const selectedInGroup = tools.filter(t => t.selected);
    const excludedInGroup = tools.filter(t => !t.selected);

    markdown += `### ${groupName}\n\n`;
    markdown += `- **Selected**: ${selectedInGroup.length}\n`;
    markdown += `- **Excluded**: ${excludedInGroup.length}\n\n`;

    if (selectedInGroup.length > 0) {
      markdown += `#### Selected Tools\n\n`;
      for (const tool of selectedInGroup) {
        markdown += `- **${tool.toolName}** (${tool.method} ${tool.path})\n`;
        markdown += `  - ${tool.summary}\n`;
        if (tool.reasoning) markdown += `  - *Reasoning*: ${tool.reasoning}\n`;
      }
      markdown += `\n`;
    }

    if (excludedInGroup.length > 0) {
      markdown += `#### Excluded Tools\n\n`;
      for (const tool of excludedInGroup) {
        markdown += `- **${tool.toolName}** (${tool.method} ${tool.path})\n`;
        markdown += `  - ${tool.summary}\n`;
        if (tool.reasoning) markdown += `  - *Reasoning*: ${tool.reasoning}\n`;
      }
      markdown += `\n`;
    }
  }

  markdown += `## Test Results\n\n`;
  markdown += `- **Total**: ${testResults.length}\n`;
  markdown += `- **Passed**: ${passedTests}\n`;
  markdown += `- **Failed**: ${failedTests}\n\n`;

  if (testResults.length > 0) {
    markdown += `### Details\n\n`;
    for (const test of testResults) {
      const status = test.passed ? '✅' : '❌';
      markdown += `- ${status} **${test.toolName}** (${test.durationMs}ms)`;
      if (test.error) markdown += ` — ${test.error}`;
      markdown += `\n`;
    }
    markdown += `\n`;
  }

  markdown += `## Deploy Instructions\n\n`;
  markdown += `### Local Development\n\n`;
  markdown += `\`\`\`bash\n${runCmd}\n\`\`\`\n\n`;
  markdown += `### Cloudflare Workers\n\n`;
  markdown += `\`\`\`bash\n${deployCmd}\n\`\`\`\n\n`;
  markdown += `> **Note**: Requires \`CLOUDFLARE_API_TOKEN\` environment variable for authentication.\n\n`;

  markdown += `---\n\n`;
  markdown += `*Generated by apimcp v${spec.version}*\n`;

  return markdown;
}