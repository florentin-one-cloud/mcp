#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./mcp/index.js";
import { StructuredArgumentation } from "./codemode/index.js";
import { shutdownMcpAnalytics } from "../../shared/posthog/index.js";

// Export Code Mode API
export { StructuredArgumentation };
export * from "./codemode/index.js"; // Export types

// Run MCP Server if executed directly
if (import.meta.main) {
  const server = createServer();

  process.on("SIGTERM", async () => {
    await shutdownMcpAnalytics();
    process.exit(0);
  });

  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Structured Argumentation MCP Server running on stdio");
  }

  runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    throw error;
  });
}

// Default export for server creation (backward compatibility or testing)
export default createServer;
