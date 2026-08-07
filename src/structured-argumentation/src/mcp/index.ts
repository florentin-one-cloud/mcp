import { createFlorentinMcpServer, type ToolHandler } from "../../../shared/mcp-base/src/index.js";
import { StructuredArgumentation } from "../codemode/index.js";
import { STRUCTURED_ARGUMENTATION_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Factory function that creates and configures a structured argumentation MCP server instance.
 *
 * @returns A configured Server instance ready for MCP communication
 */
export function createServer(): Server {
  const argumentation = new StructuredArgumentation();

  const toolHandlers: Record<string, ToolHandler> = {
    structuredArgumentation: async (args) => {
      const result = await argumentation.processArgument(args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  };

  return createFlorentinMcpServer({
    name: "structured-argumentation-server",
    version: "0.4.13",
    tools: [STRUCTURED_ARGUMENTATION_TOOL],
    toolHandlers,
    onToolCall: async (toolName, _args, _result, error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      if (error) {
        posthog.captureException(error, POSTHOG_ANONYMOUS_ID, {
          tool: toolName
        });
      } else {
        posthog.capture({
          distinctId: POSTHOG_ANONYMOUS_ID,
          event: "structured argumentation processed",
          properties: {
            $process_person_profile: false
          }
        });
      }
      await posthog.flush();
    }
  });
}
