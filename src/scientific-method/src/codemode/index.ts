import { ScientificMethodCore } from "../core/ScientificMethod.js";
import { ScientificInquiryData } from "../core/types.js";

/**
 * Code Mode API for the Scientific Method MCP server.
 *
 * This class provides a programmatic interface to the scientific method workflow,
 * allowing direct integration of scientific inquiry capabilities into applications.
 * It serves as a wrapper around the core business logic, exposing a clean, typed API.
 *
 * **Purpose**:
 * - Facilitates structured scientific inquiry (observation, hypothesis, experiment, analysis, conclusion).
 * - Enforces rigorous data validation for each stage of the scientific process.
 * - Provides visualization tools for scientific data.
 *
 * **Limitations**:
 * - **Stateless Operation**: The API operates in-memory. Data persistence is not handled
 *   internally and must be managed by the consumer if cross-session state is required.
 * - **No External Side Effects**: The API does not perform external actions (like running
 *   physical experiments); it records and analyzes provided data.
 *
 * **Operational Workflows**:
 *
 * 1. **Initialization**:
 *    ```typescript
 *    const scienceApi = new ScientificMethodCodeMode();
 *    ```
 *
 * 2. **Processing an Inquiry Step**:
 *    ```typescript
 *    const result = await scienceApi.processInquiry({
 *      stage: "hypothesis",
 *      inquiryId: "exp-001",
 *      hypothesis: { ... },
 *      // ... other fields
 *    });
 *    ```
 *
 * 3. **Retrieving History**:
 *    ```typescript
 *    const history = await scienceApi.getInquiryHistory("exp-001");
 *    ```
 *
 * 4. **Visualization**:
 *    ```typescript
 *    const visual = scienceApi.visualize(result);
 *    console.log(visual);
 *    ```
 */
export class ScientificMethodCodeMode {
  private core: ScientificMethodCore;

  constructor() {
    this.core = new ScientificMethodCore();
  }

  /**
   * Processes a scientific inquiry step.
   *
   * @param input - The input data for the inquiry step.
   * @returns The validated and processed scientific inquiry data.
   */
  public async processInquiry(input: unknown): Promise<ScientificInquiryData> {
    return this.core.processScientificInquiry(input);
  }

  /**
   * Retrieves the history of a specific scientific inquiry.
   *
   * @param inquiryId - The unique identifier of the inquiry.
   * @returns An array of scientific inquiry data representing the history of the inquiry.
   */
  public async getInquiryHistory(inquiryId: string): Promise<ScientificInquiryData[]> {
    return this.core.getInquiryHistory(inquiryId);
  }

  /**
   * Generates a text visualization of the scientific inquiry data.
   *
   * @param data - The scientific inquiry data to visualize.
   * @returns A formatted string representation of the data.
   */
  public visualize(data: ScientificInquiryData): string {
    return this.core.visualizeScientificInquiry(data);
  }
}

export * from "../core/types.js";

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for ScientificMethodCodeMode.
 *
 * Wraps the ScientificMethodCodeMode API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.scientificMethod(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new ScientificMethodCodeMode();

  const server = new Server(
    { name: "scientificMethod", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "processInquiry",
      description: "Process a scientific inquiry step through the scientific method workflow",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.processInquiry(request.params.arguments);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
