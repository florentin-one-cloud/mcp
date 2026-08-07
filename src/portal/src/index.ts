#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import createPortalServer from "./portal-server.js";

// Re-export for direct usage
export default createPortalServer;

if (import.meta.main) {
  const server = createPortalServer();

  process.on("SIGTERM", async () => {
    process.exit(0);
  });

  async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Portal Gateway running on stdio");
  }

  runServer().catch((error) => {
    console.error("Fatal error running portal server:", error);
    throw error;
  });
}
