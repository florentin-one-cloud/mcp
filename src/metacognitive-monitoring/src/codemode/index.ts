import { MetacognitiveAnalyzer } from "../core/analyzer.js";
import { MetacognitiveMonitoringData, MonitoringResult } from "../core/types.js";

/**
 * Metacognitive Monitoring API for Code Mode.
 *
 * This API allows direct programmatic access to the metacognitive monitoring capabilities,
 * enabling LLMs to write code that performs self-monitoring steps.
 */
export class MetacognitiveCodeMode {
  private analyzer: MetacognitiveAnalyzer;

  constructor() {
    this.analyzer = new MetacognitiveAnalyzer();
  }

  /**
   * Performs a metacognitive monitoring assessment.
   *
   * @param input - The monitoring data input. Must be a complete object satisfying the MetacognitiveMonitoringData interface.
   * @returns The monitoring result
   */
  public async monitor(input: MetacognitiveMonitoringData): Promise<MonitoringResult> {
    // Pass strictly typed input to the analyzer
    const { result } = this.analyzer.process(input);
    return result;
  }
}

/**
 * Default instance for quick usage.
 */
export const metacognitive = new MetacognitiveCodeMode();

// Re-export types for usage in code
export * from "../core/types.js";

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for MetacognitiveCodeMode.
 *
 * Wraps the MetacognitiveCodeMode API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.metacognitiveMonitoring(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new MetacognitiveCodeMode();

  const server = new Server(
    { name: "metacognitiveMonitoring", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "monitor",
      description: "Perform a metacognitive monitoring assessment of knowledge boundaries and claim certainty",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.monitor(request.params.arguments as unknown as MetacognitiveMonitoringData);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
