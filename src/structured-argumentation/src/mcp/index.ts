import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StructuredArgumentation } from "../codemode/index.js";
import { STRUCTURED_ARGUMENTATION_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a structured argumentation MCP server instance.
 *
 * @returns A configured Server instance ready for MCP communication
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "structured-argumentation-server",
      version: "0.4.14"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const argumentation = new StructuredArgumentation();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [STRUCTURED_ARGUMENTATION_TOOL]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "structuredArgumentation") {
      const posthog = getPostHogClient();
      try {
        const result = await argumentation.processArgument(request.params.arguments);

        if (posthog) {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "structured argumentation processed",
            properties: {
              $process_person_profile: false
            }
          });
          await posthog.flush();
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        if (posthog) {
          posthog.captureException(error instanceof Error ? error : new Error(String(error)), POSTHOG_ANONYMOUS_ID, {
            tool: "structuredArgumentation"
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
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${request.params.name}`
        }
      ],
      isError: true
    };
  });

  return server;
}
