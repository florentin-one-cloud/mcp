import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { PostHog } from "posthog-node";
import { instrument } from "@posthog/mcp";
import { MCP_ERROR_CODES, MCP_PROTOCOL_VERSION } from "./mcp-error-codes.js";

export { MCP_ERROR_CODES, MCP_PROTOCOL_VERSION };

/**
 * Result returned by a tool handler.
 * Mirrors the MCP SDK's expected `CallToolResult` shape.
 */
export interface ToolCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/** Signature for a tool handler function. Receives raw args and optional _meta. */
export type ToolHandler = (
  args: unknown,
  meta?: Record<string, unknown>
) => Promise<ToolCallResult>;

/** Capabilities to advertise. Defaults to `{ tools: {} }`. */
export interface ServerCapabilities {
  tools?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

/** Options for creating a Florentin One MCP server via the factory. */
export interface McpServerOptions {
  /** The server name, reported in server/discover and _meta */
  name: string;
  /** The server version */
  version: string;
  /** Tool definitions exposed via tools/list */
  tools: Tool[];
  /** Map of tool name → handler function */
  toolHandlers: Record<string, ToolHandler>;
  /** Optional analytics hook invoked after every tool call */
  onToolCall?: (
    toolName: string,
    args: unknown,
    result: ToolCallResult,
    error?: Error
  ) => Promise<void>;
  /** Optional capabilities to advertise beyond tools. Defaults to `{ tools: {} }`. */
  capabilities?: Omit<ServerCapabilities, "tools">;
}

// ---------------------------------------------------------------------------
// PostHog instrumentation
// ---------------------------------------------------------------------------

function getPostHogClient(): PostHog | null {
  const token = process.env["mcp_POSTHOG_PROJECT_TOKEN"];
  if (!token) return null;
  return new PostHog(token, {
    host: (process.env.POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serverInfoMeta(name: string, version: string) {
  return { "io.modelcontextprotocol/serverInfo": { name, version } };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a Florentin One MCP server instance compliant with MCP 2026-07-28.
 *
 * Registers three request handlers:
 *   - `server/discover` – stateless protocol discovery (no initialize handshake)
 *   - `tools/list`     – tool listing with CacheableResult metadata
 *   - `tools/call`     – tool execution with protocol version validation
 *
 * Note: `server/discover` is registered via the internal `_requestHandlers`
 * map because the MCP SDK v1.26.0 `setRequestHandler` requires a Zod schema
 * and `server/discover` is not part of the standard SDK schemas yet.
 *
 * @param options - Server configuration including tools and handlers.
 * @returns A fully configured `Server` ready for transport binding.
 */
export function createFlorentinMcpServer(options: McpServerOptions): Server {
  const capabilities = {
    tools: {},
    ...options.capabilities
  };
  const server = new Server(
    { name: options.name, version: options.version },
    { capabilities }
  );

  // Auto-instrument with PostHog if credentials are configured
  const posthog = getPostHogClient();
  if (posthog) {
    instrument(server, posthog);
  }

  // ---- server/discover (MCP 2026-07-28: stateless, no initialize handshake) ----
  // Registered via internal map because `setRequestHandler` requires a Zod schema
  // and server/discover is not yet part of the standard MCP SDK schemas.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (server as any)._requestHandlers.set("server/discover", async () => ({
    protocolVersions: [MCP_PROTOCOL_VERSION],
    capabilities,
    serverInfo: { name: options.name, version: options.version }
  }));

  // ---- tools/list (CacheableResult: ttlMs + cacheScope) ----
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: options.tools,
    resultType: "complete" as const,
    ttlMs: 300000,
    cacheScope: "public" as const
  }));

  // ---- tools/call ----
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (request.params as any)._meta as Record<string, unknown> | undefined;

    // Validate protocol version from _meta
    const protocolVersion = meta?.["io.modelcontextprotocol/protocolVersion"] as string | undefined;
    if (protocolVersion && protocolVersion !== MCP_PROTOCOL_VERSION) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Unsupported protocol version: ${protocolVersion}. Supported: ${MCP_PROTOCOL_VERSION}`
          }
        ],
        isError: true,
        resultType: "complete" as const,
        _meta: serverInfoMeta(options.name, options.version)
      };
    }

    const handler = options.toolHandlers[toolName];
    if (!handler) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${toolName}` }],
        isError: true,
        resultType: "complete" as const,
        _meta: serverInfoMeta(options.name, options.version)
      };
    }

    try {
      const result = await handler(args, meta);
      if (options.onToolCall) {
        options.onToolCall(toolName, args, result).catch(() => {
          // Silently ignore analytics errors
        });
      }
      return {
        ...result,
        resultType: "complete" as const,
        _meta: serverInfoMeta(options.name, options.version)
      };
    } catch (error) {
      const errorResult: ToolCallResult = {
        content: [
          {
            type: "text" as const,
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
      if (options.onToolCall) {
        options.onToolCall(
          toolName,
          args,
          errorResult,
          error instanceof Error ? error : new Error(String(error))
        ).catch(() => {
          // Silently ignore analytics errors
        });
      }
      return {
        ...errorResult,
        resultType: "complete" as const,
        _meta: serverInfoMeta(options.name, options.version)
      };
    }
  });

  return server;
}

/**
 * Validates the MCP protocol version embedded in the request _meta.
 *
 * Exported so downstream consumers (e.g. workers-adapter) and tests can
 * validate protocol versions independently of the full handler.
 *
 * @param meta - The `_meta` field from the JSON-RPC request params.
 * @returns `{ valid: true }` if OK, or `{ valid: false, error: "..." }`.
 */
export function validateProtocolVersion(
  meta: Record<string, unknown> | undefined
): { valid: boolean; error?: string } {
  if (!meta) return { valid: true };
  const version = meta["io.modelcontextprotocol/protocolVersion"] as string | undefined;
  if (version && version !== MCP_PROTOCOL_VERSION) {
    return {
      valid: false,
      error: `Unsupported protocol version: ${version}. Supported: ${MCP_PROTOCOL_VERSION}`
    };
  }
  return { valid: true };
}
