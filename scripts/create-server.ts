#!/usr/bin/env node

import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

// ---------------------------------------------------------------------------
// Interactive prompts
// ---------------------------------------------------------------------------

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function prompt(): Promise<{
  name: string;
  description: string;
  toolName: string;
  pascalName: string;
  displayName: string;
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n🔧 Florentin One MCP Server Scaffolder\n");

  const name = await ask(rl, "Server name (kebab-case, e.g. my-reasoning): ");
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    console.error(`ERROR: "${name}" is not valid kebab-case.`);
    process.exit(1);
  }

  const description = await ask(rl, "Description (e.g. My Reasoning Tool): ");
  if (!description) {
    console.error("ERROR: Description is required.");
    process.exit(1);
  }

  const toolName = await ask(rl, "Tool name (camelCase, e.g. myReasoning): ");
  if (!/^[a-z][a-zA-Z0-9]*$/.test(toolName)) {
    console.error(`ERROR: "${toolName}" is not valid camelCase.`);
    process.exit(1);
  }

  rl.close();

  // Derive PascalCase name
  const pascalName = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  // Derive display name
  const displayName = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") + " Server";

  return { name, description, toolName, pascalName, displayName };
}

// ---------------------------------------------------------------------------
// File templates
// ---------------------------------------------------------------------------

function pkgJson(name: string, description: string): string {
  return JSON.stringify(
    {
      name: `@florentin-one/mcp-${name}`,
      version: "0.1.0",
      description,
      license: "MIT",
      type: "module",
      main: "./dist/index.js",
      exports: "./dist/index.js",
      types: "./dist/types/index.d.ts",
      repository: {
        type: "git",
        url: "git+https://github.com/florentin-one-cloud/mcp.git",
        directory: `src/${name}`
      },
      publishConfig: {
        access: "public",
        tag: "latest"
      },
      bugs: {
        url: "https://github.com/florentin-one-cloud/mcp/issues"
      },
      homepage: `https://github.com/florentin-one-cloud/mcp/tree/main/src/${name}`,
      author: "Phichayut 'Florentin' Sakwiset (https://github.com/heyFlorentin)",
      keywords: ["mcp", name],
      bin: {
        [`mcp-server-${name}`]: "dist/index.js"
      },
      files: ["dist"],
      scripts: {
        build: "tsup && tsc",
        start: "node ./dist/index.js",
        test: "vitest run",
        deploy: "pnpm exec wrangler deploy"
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "1.26.0",
        "@cloudflare/codemode": "0.5.1"
      },
      devDependencies: {
        "@types/node": "22",
        typescript: "5.9.3",
        wrangler: "4.115.0",
        vitest: "3.1.3",
        tsup: "8.5.1"
      }
    },
    null,
    2
  );
}

function tsconfigJson(): string {
  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/tsconfig",
      extends: "../../tsconfig.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "..",
        strict: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        declaration: true,
        emitDeclarationOnly: true,
        outFile: "./dist/types/index.d.ts",
        noEmit: false
      },
      include: ["./**/*.ts", "./**/**/*.ts", "../shared/**/*.ts"],
      exclude: ["node_modules", "dist"]
    },
    null,
    2
  );
}

function tsupConfig(): string {
  return `import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/worker.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "esnext",
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: true
});
`;
}

function wranglerJsonc(name: string): string {
  return JSON.stringify(
    {
      $schema: "../../node_modules/wrangler/config-schema.json",
      main: "dist/worker.js",
      compatibility_flags: ["nodejs_compat"],
      compatibility_date: "2026-07-29",
      workers_dev: true,
      preview_urls: true,
      observability: {
        logs: {
          enabled: true,
          invocation_logs: false
        }
      },
      cache: {
        enabled: true
      },
      name
    },
    null,
    2
  );
}

function vitestConfig(): string {
  return `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"]
  }
});
`;
}

function srcIndex(name: string, pascalName: string): string {
  return `#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer from "./mcp/server.js";
import { shutdownMcpAnalytics } from "../../shared/posthog/index.js";

// Export Core Types and Logic
export * from "./core/types.js";
export * from "./core/logic.js";

// Export Code Mode API
export * from "./codemode/index.js";

// Export MCP Server Factory
export { createServer };

/**
 * Main execution block that runs the ${name} server when executed as a script.
 */
if (import.meta.main) {
  const server = createServer();

  process.on("SIGTERM", async () => {
    await shutdownMcpAnalytics();
    process.exit(0);
  });

  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("${pascalName} MCP Server running on stdio");
  }

  runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    throw error;
  });
}
`;
}

function srcWorker(): string {
  return `import createServer from "./mcp/server.js";
import { createWorkerHandler } from "../../shared/workers-adapter/index.js";

const server = createServer();
export default createWorkerHandler(server);
`;
}

function mcpServer(name: string, toolName: string): string {
  return `import { createFlorentinMcpServer } from "../../../shared/mcp-base/src/index.js";
import type { ToolCallResult } from "../../../shared/mcp-base/src/index.js";
import { ${toolName}Tool } from "./tools.js";

/**
 * Factory function that creates and configures a ${name} MCP server instance.
 */
export default function createServer() {
  return createFlorentinMcpServer({
    name: "${name}-server",
    version: "0.1.0",
    tools: [${toolName}Tool],
    toolHandlers: {
      ${toolName}: async (args: unknown) => {
        try {
          // TODO: Implement tool handler logic
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ status: "ok", args }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : String(error),
                    status: "failed"
                  },
                  null,
                  2
                )
              }
            ],
            isError: true
          };
        }
      }
    }
  });
}
`;
}

function mcpTools(toolName: string): string {
  return `import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ${toolName}Tool: Tool = {
  name: "${toolName}",
  description: \`TODO: Add tool description.

When to use this tool:
- TODO: Add usage guidance

Key features:
- TODO: Add feature list\`,

  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The input to process"
      }
    },
    required: ["input"]
  }
};
`;
}

function coreTypes(): string {
  return `/** Domain types for the server. */

export interface InputData {
  input: string;
}

export interface OutputData {
  status: string;
  result: string;
}
`;
}

function coreLogic(pascalName: string): string {
  return `import { InputData, OutputData } from "./types.js";

export class ${pascalName}Manager {
  /**
   * Process the input and return a result.
   */
  public process(input: InputData): OutputData {
    return {
      status: "ok",
      result: \`Processed: \${input.input}\`
    };
  }
}
`;
}

function codemodeIndex(pascalName: string, toolName: string): string {
  return `import { ${pascalName}Manager } from "../core/logic.js";
import { InputData, OutputData } from "../core/types.js";

export class ${pascalName} {
  private manager: ${pascalName}Manager;

  constructor() {
    this.manager = new ${pascalName}Manager();
  }

  /**
   * Process an input and return the result.
   */
  public async execute(input: unknown): Promise<OutputData> {
    const data = input as InputData;
    return this.manager.process(data);
  }
}

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for ${pascalName}.
 *
 * Wraps the ${pascalName} API as tools inside an MCP server,
 * then bridges it with \`codeMcpServer\` so LLMs can call \`codemode.${toolName}(args)\`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new ${pascalName}();

  const server = new Server(
    { name: "${toolName}", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "${toolName}",
      description: "Execute the ${toolName} tool",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.execute(request.params.arguments);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
`;
}

function testTemplate(name: string): string {
  return `import { describe, expect, it, beforeEach } from "vitest";

describe("${name} Logic", () => {
  it("should process input correctly", () => {
    // TODO: Add tests
    expect(true).toBe(true);
  });
});
`;
}

function npmignore(): string {
  return `src/
tests/
*.test.ts
tsconfig.json
.DS_Store
`;
}

function license(): string {
  return `MIT License

Copyright (c) 2026 Phichayut Sakwiset (Florentin One)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function readme(name: string, description: string, toolName: string): string {
  return `# ${name} MCP Server

${description}

## 📦 Installation

### npm

\`\`\`bash
npm install @florentin-one/mcp-${name}
\`\`\`

## 🚀 Usage

### Local Mode (stdio)

Use with MCP clients like Cursor or Claude Desktop:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "bunx",
      "args": ["@florentin-one/mcp-${name}@latest"]
    }
  }
}
\`\`\`

### HTTP Mode (Cloudflare Workers)

The server is also deployed as a Cloudflare Worker for HTTP access:

\`\`\`
https://mcp.florentin-one.de/mcp/${name}
\`\`\`

## API

### Code Mode Usage

\`\`\`typescript
import { ${toolName.charAt(0).toUpperCase() + toolName.slice(1)} } from "@florentin-one/mcp-${name}";
\`\`\`

### MCP Tools

- **${toolName}**: ${description}
`;
}

// ---------------------------------------------------------------------------
// File writer
// ---------------------------------------------------------------------------

function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`);
}

// ---------------------------------------------------------------------------
// Portal registration
// ---------------------------------------------------------------------------

function registerInPortal(name: string, toolName: string, displayName: string): void {
  const routerPath = path.join(SRC, "portal", "src", "tool-router.ts");

  if (!fs.existsSync(routerPath)) {
    console.warn(`  ⚠ Portal tool-router not found at ${routerPath}. Skipping registration.`);
    return;
  }

  let content = fs.readFileSync(routerPath, "utf-8");

  // Check if already registered
  if (content.includes(`service: "${name}"`)) {
    console.log(`  ⓘ Server "${name}" already registered in portal. Skipping.`);
    return;
  }

  // Find the insertion point: after the last entry in BACKEND_SERVERS array, before the closing ];
  const marker = "]\n];";
  const insertPoint = content.lastIndexOf(marker);

  if (insertPoint === -1) {
    // Fallback: try finding the last entry's closing brace before ];
    const altMarker = "}\n];";
    const altPoint = content.lastIndexOf(altMarker);
    if (altPoint === -1) {
      console.warn("  ⚠ Could not find insertion point in tool-router.ts. Skipping portal registration.");
      return;
    }
    const entry = `
  {
    service: "${name}",
    displayName: "${displayName}",
    tools: ["${toolName}"]
  },`;
    content = content.slice(0, altPoint + 1) + entry + content.slice(altPoint + 1);
  } else {
    const entry = `
  {
    service: "${name}",
    displayName: "${displayName}",
    tools: ["${toolName}"]
  },`;
    content = content.slice(0, insertPoint + 1) + entry + content.slice(insertPoint + 1);
  }

  fs.writeFileSync(routerPath, content, "utf-8");
  console.log(`  ✓ Registered in portal/src/tool-router.ts`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { name, description, toolName, pascalName, displayName } = await prompt();

  const serverDir = path.join(SRC, name);

  if (fs.existsSync(serverDir)) {
    console.error(`ERROR: Directory "src/${name}" already exists.`);
    process.exit(1);
  }

  console.log(`\nScaffolding server "${name}" in src/${name}/ ...\n`);

  // Root-level config files
  writeFile(path.join(serverDir, "package.json"), pkgJson(name, description));
  writeFile(path.join(serverDir, "tsconfig.json"), tsconfigJson());
  writeFile(path.join(serverDir, "tsup.config.ts"), tsupConfig());
  writeFile(path.join(serverDir, "wrangler.jsonc"), wranglerJsonc(name));
  writeFile(path.join(serverDir, "vitest.config.ts"), vitestConfig());
  writeFile(path.join(serverDir, ".npmignore"), npmignore());
  writeFile(path.join(serverDir, "LICENSE"), license());
  writeFile(path.join(serverDir, "README.md"), readme(name, description, toolName));

  // Source files
  writeFile(path.join(serverDir, "src", "index.ts"), srcIndex(name, pascalName));
  writeFile(path.join(serverDir, "src", "worker.ts"), srcWorker());
  writeFile(path.join(serverDir, "src", "mcp", "server.ts"), mcpServer(name, toolName));
  writeFile(path.join(serverDir, "src", "mcp", "tools.ts"), mcpTools(toolName));
  writeFile(path.join(serverDir, "src", "core", "types.ts"), coreTypes());
  writeFile(path.join(serverDir, "src", "core", "logic.ts"), coreLogic(pascalName));
  writeFile(path.join(serverDir, "src", "codemode", "index.ts"), codemodeIndex(pascalName, toolName));

  // Test files
  writeFile(path.join(serverDir, "tests", "core", "logic.test.ts"), testTemplate(name));

  // Portal registration
  registerInPortal(name, toolName, displayName);

  console.log(`\n✅ Server "${name}" scaffolded successfully!\n`);
  console.log("Next steps:");
  console.log(`  1. pnpm install`);
  console.log(`  2. cd src/${name} && pnpm build`);
  console.log(`  3. cd src/${name} && pnpm test`);
  console.log(`  4. Set secrets: pnpm exec wrangler secret put MCP_POSTHOG_PROJECT_TOKEN`);
  console.log(`  5. Deploy: cd src/${name} && pnpm deploy\n`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
