import { CollaborativeReasoningManager } from "../core/logic.js";
import { CollaborativeReasoningData } from "../core/types.js";

export class CollaborativeReasoning {
  private manager: CollaborativeReasoningManager;

  constructor() {
    this.manager = new CollaborativeReasoningManager();
  }

  /**
   * Process a collaborative reasoning step.
   * Validates the input, updates the session history, and determines the next persona if needed.
   *
   * @param input The collaborative reasoning data state
   * @returns The updated collaborative reasoning data
   */
  public async collaborate(input: unknown): Promise<CollaborativeReasoningData> {
    const validatedInput = this.manager.validateCollaborativeReasoningData(input);

    // Update the next persona if not specified
    if (!validatedInput.nextPersonaId && validatedInput.nextContributionNeeded) {
      validatedInput.nextPersonaId = this.manager.selectNextPersona(validatedInput);
    }

    // Update session state
    this.manager.updateSessionHistory(validatedInput);

    return validatedInput;
  }

  /**
   * Generate a text visualization of the collaborative reasoning state.
   *
   * @param data The collaborative reasoning data
   * @returns A string representation of the state suitable for console output
   */
  public visualize(data: CollaborativeReasoningData): string {
    return this.manager.visualizeCollaborativeReasoning(data);
  }
}

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for CollaborativeReasoning.
 *
 * Wraps the CollaborativeReasoning API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.collaborativeReasoning(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new CollaborativeReasoning();

  const server = new Server(
    { name: "collaborativeReasoning", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "collaborate",
      description: "Process a collaborative reasoning step with multi-persona analysis",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.collaborate(request.params.arguments);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
