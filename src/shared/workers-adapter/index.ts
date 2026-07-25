import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { JSONRPCMessage, JSONRPCRequest, JSONRPCResponse } from "@modelcontextprotocol/sdk/types.js";

/**
 * HTTP-to-MCP adapter for Cloudflare Workers
 * 
 * Converts HTTP POST requests to MCP JSON-RPC format and routes them to the MCP server.
 * Supports the Model Context Protocol over HTTP transport.
 */

interface WorkerEnv {
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
    async fetch(request: Request, env?: WorkerEnv): Promise<Response> {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders()
        });
      }

      // Only accept POST requests
      if (request.method !== "POST") {
        return jsonResponse(
          {
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: "Invalid Request: Only POST method is supported"
            },
            id: null
          },
          405,
          getCorsHeaders()
        );
      }

      try {
        // Parse JSON-RPC request
        const body = await request.text();
        let rpcRequest: JSONRPCRequest;

        try {
          rpcRequest = JSON.parse(body) as JSONRPCRequest;
        } catch (parseError) {
          return jsonResponse(
            {
              jsonrpc: "2.0",
              error: {
                code: -32700,
                message: "Parse error: Invalid JSON"
              },
              id: null
            },
            400,
            getCorsHeaders()
          );
        }

        // Validate JSON-RPC structure
        if (!rpcRequest.jsonrpc || rpcRequest.jsonrpc !== "2.0") {
          return jsonResponse(
            {
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: jsonrpc version must be 2.0"
              },
              id: rpcRequest.id ?? null
            },
            400,
            getCorsHeaders()
          );
        }

        if (!rpcRequest.method) {
          return jsonResponse(
            {
              jsonrpc: "2.0",
              error: {
                code: -32600,
                message: "Invalid Request: method is required"
              },
              id: rpcRequest.id ?? null
            },
            400,
            getCorsHeaders()
          );
        }

        // Handle MCP protocol methods
        const response = await handleMcpRequest(server, rpcRequest, env);
        return jsonResponse(response, 200, getCorsHeaders());

      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return jsonResponse(
          {
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: `Internal error: ${errorMessage}`
            },
            id: null
          },
          500,
          getCorsHeaders()
        );
      }
    }
  };
}

/**
 * Routes MCP JSON-RPC requests to the appropriate server handler
 */
async function handleMcpRequest(
  server: Server,
  request: JSONRPCRequest,
  env?: WorkerEnv
): Promise<JSONRPCResponse> {
  try {
    // Create a mock transport for processing the request
    const responsePromise = new Promise<JSONRPCResponse>((resolve) => {
      // Access the internal request handler
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

      // Execute the handler
      handler(request)
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
 * Returns CORS headers for browser client support
 */
function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

/**
 * Helper to create JSON responses
 */
function jsonResponse(
  data: any,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}
