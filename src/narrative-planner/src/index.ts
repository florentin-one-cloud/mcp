#!/usr/bin/env bun
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createServer, { NarrativePlannerServer } from "./mcp/server.js";
import { shutdownMcpAnalytics } from "../../shared/posthog/index.js";

// Export Code Mode API
export { NarrativePlanner } from "./codemode/index.js";
export * from "./core/types.js";

// Export MCP Server Factory and Class for compatibility/testing
export { NarrativePlannerServer };
export default createServer;

// Run Server
if (import.meta.main) {
  const server = createServer();

  process.on("SIGTERM", async () => {
    await shutdownMcpAnalytics();
    process.exit(0);
  });

  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Narrative Planner MCP Server running on stdio");
  }

  runServer().catch((err) => {
    console.error("Fatal error running server:", err);
    throw err;
  });
}
