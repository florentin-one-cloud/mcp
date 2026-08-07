import {
  createFlorentinMcpServer,
  MCP_ERROR_CODES,
  MCP_PROTOCOL_VERSION
} from "../../shared/mcp-base/src/index.js";
import {
  BACKEND_SERVERS,
  getBackendForTool,
  getBackendUrl,
  getPortalDomain
} from "./tool-router.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Placeholder tool — the portal itself exposes no tools directly; it
// aggregates from backends dynamically.
// ---------------------------------------------------------------------------

const PLACEHOLDER_TOOL: Tool = {
  name: "portal_discover",
  description: "Portal discovery placeholder — use server/discover for backend listing.",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

// ---------------------------------------------------------------------------
// Backend MCP HTTP client
// ---------------------------------------------------------------------------

interface JsonRpcResponse {
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string };
  id: string | number | null;
}

async function mcpRequest(backendUrl: string, method: string, params?: unknown): Promise<JsonRpcResponse> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params: params ?? {},
    id: crypto.randomUUID()
  });

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Mcp-Method": method,
      "Mcp-Name": "mcp-portal"
    },
    body
  });

  if (!response.ok) {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: `Backend ${backendUrl} returned HTTP ${response.status}: ${response.statusText}`
      },
      id: null
    };
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as JsonRpcResponse;
  } catch {
    return {
      jsonrpc: "2.0",
      error: { code: -32700, message: `Backend ${backendUrl} returned invalid JSON` },
      id: null
    };
  }
}

// ---------------------------------------------------------------------------
// Tool aggregation: fetch tools from all backends
// ---------------------------------------------------------------------------

async function fetchAllBackendTools(): Promise<{
  tools: Tool[];
  errors: string[];
}> {
  const tools: Tool[] = [];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    BACKEND_SERVERS.map(async (backend) => {
      const url = getBackendUrl(backend.service);
      const response = await mcpRequest(url, "tools/list");
      if (response.error) {
        errors.push(`${backend.service}: ${response.error.message}`);
        return;
      }
      const result = response.result as { tools?: Tool[] } | undefined;
      if (result?.tools) {
        for (const tool of result.tools) {
          tools.push(tool);
        }
      }
    })
  );

  for (const result of results) {
    if (result.status === "rejected") {
      errors.push(`fetch failed: ${(result.reason as Error)?.message ?? String(result.reason)}`);
    }
  }

  return { tools, errors };
}

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

/**
 * Creates the MCP Portal server — a centralized gateway that aggregates
 * tools from all 7 Florentin One reasoning MCP servers.
 *
 * Overrides the standard createFlorentinMcpServer handlers for:
 * - `server/discover`: advertises all 7 backend servers
 * - `tools/list`: fetches tools from all backends and aggregates them
 * - `tools/call`: routes to the correct backend based on tool name
 */
export default function createPortalServer() {
  const server = createFlorentinMcpServer({
    name: "mcp-portal-gateway",
    version: "1.0.0",
    tools: [PLACEHOLDER_TOOL],
    toolHandlers: {
      portal_discover: async () => ({
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              BACKEND_SERVERS.map((b) => ({
                service: b.service,
                displayName: b.displayName,
                toolCount: b.tools.length
              })),
              null,
              2
            )
          }
        ]
      })
    }
  });

  // ---- Override server/discover to advertise all backends ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (server as any)._requestHandlers.set("server/discover", async () => {
    const domain = (() => {
      try {
        return getPortalDomain();
      } catch {
        return "<MCP_PORTAL_DOMAIN not configured>";
      }
    })();

    return {
      protocolVersions: [MCP_PROTOCOL_VERSION],
      capabilities: { tools: {} },
      serverInfo: { name: "mcp-portal-gateway", version: "1.0.0" },
      backends: BACKEND_SERVERS.map((b) => ({
        name: b.displayName,
        service: b.service,
        url: domain.startsWith("<") ? "<not configured>" : getBackendUrl(b.service),
        tools: b.tools
      }))
    };
  });

  // ---- Override tools/list to aggregate from all backends ----
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => {
      const { tools, errors } = await fetchAllBackendTools();

      return {
        tools,
        resultType: "complete" as const,
        ttlMs: 300000,
        cacheScope: "public" as const,
        _meta: {
          portal: "mcp-portal-gateway/1.0.0",
          backendCount: BACKEND_SERVERS.length,
          fetchErrors: errors.length > 0 ? errors : undefined
        }
      };
    }
  );

  // ---- Override tools/call to route to the correct backend ----
  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const toolName = request.params.name;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (request.params as any)._meta as Record<string, unknown> | undefined;

      const backend = getBackendForTool(toolName);
      if (!backend) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${toolName}. This portal aggregates tools from: ${BACKEND_SERVERS.map((b) => b.service).join(", ")}`
            }
          ],
          isError: true,
          resultType: "complete" as const,
          _meta: { "io.modelcontextprotocol/serverInfo": { name: "mcp-portal-gateway", version: "1.0.0" } }
        };
      }

      const backendUrl = getBackendUrl(backend.service);

      try {
        const response = await mcpRequest(backendUrl, "tools/call", {
          name: toolName,
          arguments: request.params.arguments,
          _meta: meta
        });

        if (response.error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Backend ${backend.service} error: ${response.error.message} (code: ${response.error.code})`
              }
            ],
            isError: true,
            resultType: "complete" as const,
            _meta: { "io.modelcontextprotocol/serverInfo": { name: "mcp-portal-gateway", version: "1.0.0" } }
          };
        }

        const result = response.result as Record<string, unknown> | undefined;
        return {
          ...(result ?? {}),
          resultType: "complete" as const,
          _meta: {
            "io.modelcontextprotocol/serverInfo": { name: "mcp-portal-gateway", version: "1.0.0" },
            portal: { backend: backend.service }
          }
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to route ${toolName} to ${backend.service}: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true,
          resultType: "complete" as const,
          _meta: { "io.modelcontextprotocol/serverInfo": { name: "mcp-portal-gateway", version: "1.0.0" } }
        };
      }
    }
  );

  return server;
}

export { MCP_ERROR_CODES, MCP_PROTOCOL_VERSION };
