import { ArgumentationManager } from "../core/manager.js";
import { ArgumentAnalysis, ArgumentData, ArgumentType } from "../core/types.js";

export class StructuredArgumentation {
  private manager: ArgumentationManager;

  constructor() {
    this.manager = new ArgumentationManager();
  }

  /**
   * Processes an argument input, updates the internal state, and returns analysis.
   *
   * @param input - The argument data to process.
   * @returns The analysis of the argument.
   */
  public async processArgument(input: unknown): Promise<ArgumentAnalysis> {
    return this.manager.processArgument(input);
  }
}

export type { ArgumentAnalysis, ArgumentData, ArgumentType };

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for StructuredArgumentation.
 *
 * Wraps the StructuredArgumentation API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.structuredArgumentation(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new StructuredArgumentation();

  const server = new Server(
    { name: "structuredArgumentation", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "processArgument",
      description: "Process an argument through systematic dialectical reasoning analysis",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.processArgument(request.params.arguments);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
