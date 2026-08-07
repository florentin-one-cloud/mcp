import { NarrativeInput, NarrativeOutline } from "../core/types.js";
import { planNarrative, validateNarrativeInput } from "../core/logic.js";

/**
 * AI Tool: Narrative Planner Code Mode API
 * Purpose: Provides programmatic access to narrative planning functionality for integration into applications.
 * Limitations: Generates template-based outlines; requires valid inputs; does not persist state.
 * Workflow: 1. Instantiate class 2. Call planNarrative() with input 3. Receive structured outline
 */
export class NarrativePlanner {
  /**
   * Generates a simple three-act story outline based on the input.
   * @param input The narrative parameters (premise, characters, arcs).
   * @returns The structured narrative outline.
   */
  public planNarrative(input: NarrativeInput): NarrativeOutline {
    const validated = validateNarrativeInput(input);
    return planNarrative(validated);
  }

  /**
   * Batch processes multiple narrative plans.
   * @param inputs Array of narrative inputs.
   * @returns Array of narrative outlines.
   */
  public planNarratives(inputs: NarrativeInput[]): NarrativeOutline[] {
    return inputs.map((input) => this.planNarrative(input));
  }
}

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for NarrativePlanner.
 *
 * Wraps the NarrativePlanner API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.narrativePlanner(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new NarrativePlanner();

  const server = new Server(
    { name: "narrativePlanner", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "planNarrative",
      description: "Generate a structured narrative outline from input parameters",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = api.planNarrative(request.params.arguments as unknown as NarrativeInput);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
