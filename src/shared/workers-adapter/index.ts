import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { JSONRPCRequest, JSONRPCResponse } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP 2026-07-28 Error Codes — duplicated here to avoid direct dependency on mcp-base.
 * These MUST be kept in sync with `src/shared/mcp-base/src/mcp-error-codes.ts`.
 */
export const MCP_ERROR_CODES = {
  HEADER_MISMATCH: -32020,
  MISSING_REQUIRED_CLIENT_CAPABILITY: -32021,
  UNSUPPORTED_PROTOCOL_VERSION: -32022
} as const;

/**
 * HTTP-to-MCP adapter for Cloudflare Workers — MCP 2026-07-28 Streamable HTTP.
 *
 * Converts HTTP POST requests to MCP JSON-RPC format and routes them to the MCP server.
 * No session state is managed (`Mcp-Session-Id` is not used).
 *
 * Required request headers (MCP 2026-07-28):
 *   - `Mcp-Method`:  The JSON-RPC method being invoked (e.g. `tools/call`, `server/discover`).
 *   - `Mcp-Name`:    A name identifying the server/client.
 */

export interface WorkerEnv {
  [key: string]: unknown;
}

/**
 * Creates a Cloudflare Workers fetch handler from an MCP server instance.
 *
 * @param server - The MCP server instance to wrap
 * @returns A fetch handler compatible with Cloudflare Workers
 */
export function createWorkerHandler(server: Server) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetch(request: Request, _env?: WorkerEnv): Promise<Response> {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders()
        });
      }

      // Only accept POST requests
      if (request.method !== "POST") {
        return jsonRpcErrorResponse(
          -32600,
          "Invalid Request: Only POST method is supported",
          null,
          405,
          getCorsHeaders()
        );
      }

      // ---- MCP 2026-07-28: Validate required Streamable HTTP headers ----
      const mcpMethod = request.headers.get("Mcp-Method");
      const mcpName = request.headers.get("Mcp-Name");

      if (!mcpMethod) {
        return jsonRpcErrorResponse(
          MCP_ERROR_CODES.HEADER_MISMATCH,
          "HeaderMismatch: Missing required header Mcp-Method",
          null,
          400,
          getCorsHeaders()
        );
      }

      if (!mcpName) {
        return jsonRpcErrorResponse(
          MCP_ERROR_CODES.HEADER_MISMATCH,
          "HeaderMismatch: Missing required header Mcp-Name",
          null,
          400,
          getCorsHeaders()
        );
      }

      // ---- subscriptions/listen: long-lived POST-response stream ----
      if (mcpMethod === "subscriptions/listen") {
        return handleSubscriptionsListen(request);
      }

      try {
        // Parse JSON-RPC request body
        const body = await request.text();
        let rpcRequest: JSONRPCRequest;

        try {
          rpcRequest = JSON.parse(body) as JSONRPCRequest;
        } catch {
          return jsonRpcErrorResponse(
            -32700,
            "Parse error: Invalid JSON",
            null,
            400,
            getCorsHeaders()
          );
        }

        // Validate JSON-RPC structure
        if (!rpcRequest.jsonrpc || rpcRequest.jsonrpc !== "2.0") {
          return jsonRpcErrorResponse(
            -32600,
            "Invalid Request: jsonrpc version must be 2.0",
            rpcRequest.id ?? null,
            400,
            getCorsHeaders()
          );
        }

        if (!rpcRequest.method) {
          return jsonRpcErrorResponse(
            -32600,
            "Invalid Request: method is required",
            rpcRequest.id ?? null,
            400,
            getCorsHeaders()
          );
        }

        // Handle MCP protocol methods — pass _meta through to the server handlers
        const response = await handleMcpRequest(server, rpcRequest);
        const respHeaders = getCorsHeaders();
        respHeaders["Mcp-Name"] = mcpName;
        return jsonResponse(response, 200, respHeaders);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return jsonRpcErrorResponse(
          -32603,
          `Internal error: ${errorMessage}`,
          null,
          500,
          getCorsHeaders()
        );
      }
    }
  };
}

/**
 * Routes MCP JSON-RPC requests to the appropriate server handler.
 *
 * The `_meta` field on `request.params` (carrying protocol version, client
 * capabilities, etc.) flows through naturally to the handler.
 */
async function handleMcpRequest(server: Server, request: JSONRPCRequest): Promise<JSONRPCResponse> {
  try {
    const responsePromise = new Promise<JSONRPCResponse>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (server as any)._requestHandlers?.get?.(request.method);

      if (!handler) {
        resolve({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`
          },
          id: request.id ?? null
        });
        return;
      }

      // Execute the handler — `request` includes `params._meta` which flows through
      handler(request)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((result: any) => {
          resolve({
            jsonrpc: "2.0",
            result,
            id: request.id ?? null
          });
        })
        .catch((error: Error) => {
          resolve({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: error.message
            },
            id: request.id ?? null
          });
        });
    });

    return await responsePromise;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: errorMessage
      },
      id: request.id ?? null
    };
  }
}

/**
 * Handles the `subscriptions/listen` method (MCP 2026-07-28).
 *
 * Clients opt in to specific subscription types via the request body. The
 * server acknowledges and returns a long-lived POST-response stream that
 * stays open for server-to-client change notifications.
 */
async function handleSubscriptionsListen(request: Request): Promise<Response> {
  const corsHeaders = getCorsHeaders();

  // Parse subscription types from the request body
  let subscriptionTypes: string[] = [];
  try {
    const body = await request.text();
    const parsed = JSON.parse(body) as Record<string, unknown>;
    if (Array.isArray(parsed.types)) {
      subscriptionTypes = parsed.types as string[];
    }
  } catch {
    // If parsing fails, proceed with empty types — client receives no subscriptions
  }

  // Create a readable stream that stays open for server-to-client notifications
  const stream = new ReadableStream({
    start(controller) {
      // Send an acknowledgement event with the subscription ID
      const ack = {
        jsonrpc: "2.0",
        method: "notifications/subscription_ack",
        params: {
          subscriptionId: crypto.randomUUID(),
          types: subscriptionTypes
        }
      };
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(ack)}\n\n`));

      // Keep the stream alive — in production, server-to-client notifications
      // would be enqueued here. For now, we send a periodic keepalive.
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 15_000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}

/**
 * Returns CORS headers for browser client support.
 */
function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Method, Mcp-Name",
    "Content-Type": "application/json"
  };
}

/**
 * Helper to create JSON responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonResponse(data: any, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

/**
 * Helper to create JSON-RPC error responses.
 */
function jsonRpcErrorResponse(
  code: number,
  message: string,
  id: string | number | null,
  status: number,
  headers: Record<string, string>
): Response {
  return jsonResponse(
    {
      jsonrpc: "2.0",
      error: { code, message },
      id
    },
    status,
    headers
  );
}
