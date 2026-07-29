import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { SEQUENTIAL_THINKING_TOOL } from "./tools.js";
import { SequentialThinking } from "../codemode/index.js";
import { ThoughtData } from "../core/types.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID, instrumentMcpServer } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a sequential thinking MCP server instance.
 *
 * This function initializes a Server with the name "sequential-thinking-server" and version "0.4.13",
 * registers the SEQUENTIAL_THINKING_TOOL, and sets up request handlers.
 *
 * @returns A configured Server instance ready for MCP communication
 */
export default function createServer(): Server {
  const server = new Server(
    {
      name: "sequential-thinking-server",
      version: "0.4.13"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  instrumentMcpServer(server);
  // We use the Code Mode API to handle the logic
  const thinking = new SequentialThinking();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [SEQUENTIAL_THINKING_TOOL]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "sequentialthinking") {
      // Cast the arguments to ThoughtData (runtime validation happens inside the tracker)
      const args = request.params.arguments as unknown as ThoughtData;
      const result = thinking.think(args);

      const posthog = getPostHogClient();
      if (posthog) {
        if (result.isError) {
          const firstContent = result.content[0];
          const errMsg = firstContent && "text" in firstContent ? firstContent.text : "unknown error";
          posthog.captureException(new Error(String(errMsg)), POSTHOG_ANONYMOUS_ID, {
            tool: "sequentialthinking"
          });
        } else {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "sequential thinking step processed",
            properties: {
              thought_number: args.thoughtNumber,
              total_thoughts: args.totalThoughts,
              next_thought_needed: args.nextThoughtNeeded,
              is_revision: args.isRevision ?? false,
              has_branch: !!args.branchFromThought,
              branch_id: args.branchId ?? null
            }
          });
        }
        await posthog.flush();
      }

      return result;
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
