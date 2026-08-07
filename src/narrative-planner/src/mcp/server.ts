import { NarrativePlanner } from "../codemode/index.js";
import { NARRATIVE_PLANNER_TOOL } from "./tools.js";
import { NarrativeInput } from "../core/types.js";
import { createFlorentinMcpServer, type ToolCallResult } from "../../../shared/mcp-base/src/index.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

export class NarrativePlannerServer {
  private planner: NarrativePlanner;

  constructor() {
    this.planner = new NarrativePlanner();
  }

  async process(input: unknown) {
    try {
      const outline = this.planner.planNarrative(input as NarrativeInput);
      return { content: [{ type: "text", text: JSON.stringify(outline, null, 2) }] };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true
      };
    }
  }
}

export default function createServer() {
  const narrativeServer = new NarrativePlannerServer();

  return createFlorentinMcpServer({
    name: "narrative-planner-server",
    version: "0.4.13",
    tools: [NARRATIVE_PLANNER_TOOL],
    toolHandlers: {
      narrativePlanner: async (args: unknown): Promise<ToolCallResult> => {
        return narrativeServer.process(args) as ToolCallResult;
      }
    },
    onToolCall: async (toolName, args, result, error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      if (error || result.isError) {
        const err = error ?? new Error(String(result.content[0]?.text ?? "unknown error"));
        posthog.captureException(err, POSTHOG_ANONYMOUS_ID, { tool: toolName });
      } else {
        posthog.capture({
          distinctId: POSTHOG_ANONYMOUS_ID,
          event: "narrative planned",
          properties: {
            $process_person_profile: false
          }
        });
      }
      await posthog.flush();
    }
  });
}
