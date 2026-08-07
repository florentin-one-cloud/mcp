import { createFlorentinMcpServer } from "../../../shared/mcp-base/src/index.js";
import { SEQUENTIAL_THINKING_TOOL } from "./tools.js";
import { SequentialThinking } from "../codemode/index.js";
import { ThoughtData } from "../core/types.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a sequential thinking MCP server instance.
 *
 * Uses the shared createFlorentinMcpServer factory which handles:
 * - Server instantiation with capabilities
 * - PostHog instrumentation (via @posthog/mcp instrument)
 * - server/discover, tools/list, and tools/call handlers
 *
 * Custom analytics events (sequential thinking step processed) are captured
 * via the onToolCall hook using the PostHog client backed by POSTHOG_API_KEY.
 *
 * @returns A configured Server instance ready for MCP communication
 */
export default function createServer() {
  const thinking = new SequentialThinking();

  return createFlorentinMcpServer({
    name: "sequential-thinking-server",
    version: "0.4.13",
    tools: [SEQUENTIAL_THINKING_TOOL],
    toolHandlers: {
      sequentialthinking: async (args: unknown) => {
        return thinking.think(args as ThoughtData);
      }
    },
    onToolCall: async (toolName: string, args: unknown, _result, error?: Error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;
      const data = args as ThoughtData;
      if (error) {
        posthog.captureException(error, POSTHOG_ANONYMOUS_ID, {
          tool: toolName
        });
      } else {
        posthog.capture({
          distinctId: POSTHOG_ANONYMOUS_ID,
          event: "sequential thinking step processed",
          properties: {
            thought_number: data.thoughtNumber,
            total_thoughts: data.totalThoughts,
            next_thought_needed: data.nextThoughtNeeded,
            is_revision: data.isRevision ?? false,
            has_branch: !!data.branchFromThought,
            branch_id: data.branchId ?? null
          }
        });
      }
      await posthog.flush();
    }
  });
}
