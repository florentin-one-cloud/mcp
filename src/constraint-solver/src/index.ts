#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createFlorentinMcpServer } from "../../shared/mcp-base/src/index.js";
import { ConstraintMcpServer } from "./mcp/server.js";
import { CONSTRAINT_SOLVER_TOOL } from "./mcp/tools.js";
import {
  getPostHogClient,
  POSTHOG_ANONYMOUS_ID,
  shutdownMcpAnalytics
} from "../../shared/posthog/index.js";

// Export the Code Mode API
export { ConstraintSolver } from "./codemode/index.js";
export * from "./core/types.js";

/**
 * Factory function that creates and configures a constraint solver MCP server instance.
 */
export default function createServer() {
  const constraintServer = new ConstraintMcpServer();

  return createFlorentinMcpServer({
    name: "constraint-solver-server",
    version: "0.4.13",
    tools: [CONSTRAINT_SOLVER_TOOL],
    toolHandlers: {
      constraintSolver: async (args: unknown) => {
        return constraintServer.process(args);
      }
    },
    onToolCall: async (_toolName, _args, result, error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      if (error || result.isError) {
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
  });
}

if (import.meta.main) {
  const server = createServer();

  process.on("SIGTERM", async () => {
    await shutdownMcpAnalytics();
    process.exit(0);
  });

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
