import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID, instrumentMcpServer } from "../posthog/index.js";

/**
 * Configuration for a single MCP tool handler.
 */
export interface ToolConfig<TInput = unknown, TResult = unknown> {
  /** The tool name as registered with MCP (must match the tool definition) */
  name: string;
  /** The tool definition for tools/list */
  definition: Tool;
  /** The handler function that processes tool calls */
  handler: (input: TInput) => Promise<TResult> | TResult;
  /** Optional: extract a human-readable error message from the result */
  extractErrorMessage?: (result: TResult) => string | undefined;
  /** Optional: check if the result represents an error */
  isErrorResult?: (result: TResult) => boolean;
  /** Optional: PostHog event name for successful calls */
  eventName?: string;
  /** Optional: extract PostHog properties from a successful result */
  eventProperties?: (result: TResult) => Record<string, unknown>;
  /** Optional: PostHog tool name for exception tracking (defaults to config.name) */
  posthogToolName?: string;
}

/**
 * Creates a standard MCP Server with the common boilerplate pattern.
 *
 * Eliminates the duplicated try/catch + PostHog + unknown-tool handler pattern
 * across all 7 MCP server packages.
 *
 * @param name - Server name (e.g., "collaborative-reasoning-server")
 * @param version - Server version (e.g., "0.4.18")
 * @param tools - Array of tool configurations
 * @param options.capabilities - Additional MCP capabilities beyond tools
 * @returns A configured Server instance
 */
export function createMcpServer(
  name: string,
  version: string,
  tools: ToolConfig[],
  options?: {
    capabilities?: Record<string, unknown>;
  }
): Server {
  const server = new Server(
    { name, version },
    {
      capabilities: {
        tools: {},
        ...options?.capabilities
      }
    }
  );

  instrumentMcpServer(server);

  const toolMap = new Map(tools.map((t) => [t.name, t]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition)
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const config = toolMap.get(toolName);

    if (!config) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
        isError: true
      };
    }

    const posthog = getPostHogClient();

    try {
      const result = await config.handler(request.params.arguments as unknown);

      // Check if the result itself indicates an error (for tools that return error objects instead of throwing)
      const isError = config.isErrorResult?.(result) ?? false;
      const toolLabel = config.posthogToolName ?? config.name;

      if (posthog) {
        if (isError) {
          const errorMsg = config.extractErrorMessage?.(result) ?? "unknown error";
          posthog.captureException(new Error(String(errorMsg)), POSTHOG_ANONYMOUS_ID, {
            tool: toolLabel
          });
        } else if (config.eventName) {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: config.eventName,
            properties: config.eventProperties?.(result) ?? {}
          });
        }
        await posthog.flush();
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: isError || undefined
      };
    } catch (error) {
      if (posthog) {
        posthog.captureException(error instanceof Error ? error : new Error(String(error)), POSTHOG_ANONYMOUS_ID, {
          tool: config.posthogToolName ?? config.name
        });
        await posthog.flush();
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
                status: "failed"
              },
              null,
              2
            )
          }
        ],
        isError: true
      };
    }
  });

  return server;
}
