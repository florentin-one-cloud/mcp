import { SequentialThinkingTracker } from "../core/tracker.js";
import { ThoughtData, ThinkingProcessResult } from "../core/types.js";

/**
 * Sequential Thinking Code Mode API.
 *
 * This class exposes the Sequential Thinking capabilities as a strictly-typed
 * TypeScript API, allowing LLMs to write code that interacts directly with
 * the thinking process.
 */
export class SequentialThinking {
  private tracker: SequentialThinkingTracker;

  constructor() {
    this.tracker = new SequentialThinkingTracker();
  }

  /**
   * Process a thought in the sequential thinking process.
   *
   * @param input - The thought data to process.
   * @returns The result of the thinking process.
   */
  public think(input: ThoughtData): ThinkingProcessResult {
    // The tracker accepts unknown, but we enforce ThoughtData at this layer
    return this.tracker.processThought(input);
  }
}

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for SequentialThinking.
 *
 * Wraps the SequentialThinking API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.sequentialthinking(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new SequentialThinking();

  const server = new Server(
    { name: "sequentialthinking", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "think",
      description: "Process a thought in the sequential thinking process",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = api.think(request.params.arguments as unknown as ThoughtData);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
