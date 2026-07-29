#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { ConstraintMcpServer } from "./mcp/server.js";
import { CONSTRAINT_SOLVER_TOOL } from "./mcp/tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../shared/posthog/index.js";

// Export the Code Mode API
export { ConstraintSolver } from "./codemode/index.js";
export * from "./core/types.js";

/**
 * Factory function that creates and configures a constraint solver MCP server instance.
 */
export default function createServer(): Server {
  const server = new Server({ name: "constraint-solver-server", version: " 0.4.12" }, { capabilities: { tools: {} } });
  const constraintServer = new ConstraintMcpServer();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [CONSTRAINT_SOLVER_TOOL] }));
  server.setRequestHandler(CallToolRequestSchema, async (req: CallToolRequest) => {
    if (req.params.name === "constraintSolver") {
      const posthog = getPostHogClient();
      const result = await constraintServer.process(req.params.arguments);

      if (posthog) {
        if (result.isError) {
          const firstContent = result.content[0];
          const errMsg = firstContent && "text" in firstContent ? firstContent.text : "unknown error";
          posthog.captureException(new Error(String(errMsg)), POSTHOG_ANONYMOUS_ID, {
            tool: "constraintSolver"
          });
        } else {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "constraint solver checked",
            properties: {
              $process_person_profile: false
            }
          });
        }
        await posthog.flush();
      }

      return result;
    }
    return { content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }], isError: true };
  });

  return server;
}

if (import.meta.main) {
  const server = createServer();

  async function runServer() {
    const transport = new StdioServerTransport();
    try {
      await server.connect(transport);
      console.error("Constraint Solver MCP Server running on stdio");
    } catch (err) {
      console.error("Failed to connect constraint-solver:", err);
      throw err;
    }
  }

  runServer().catch((err) => {
    console.error("Fatal error running server:", err);
    throw err;
  });
}
