import { createFlorentinMcpServer } from "../../../shared/mcp-base/src/index.js";
import type { ToolCallResult } from "../../../shared/mcp-base/src/index.js";
import { CollaborativeReasoning } from "../codemode/index.js";
import { COLLABORATIVE_REASONING_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a collaborative reasoning MCP server instance.
 */
export default function createServer() {
  const collaborativeReasoning = new CollaborativeReasoning();

  return createFlorentinMcpServer({
    name: "collaborative-reasoning-server",
    version: "0.4.13",
    tools: [COLLABORATIVE_REASONING_TOOL],
    toolHandlers: {
      collaborativeReasoning: async (args: unknown) => {
        try {
          const result = await collaborativeReasoning.collaborate(args);

          // Generate visualization
          const visualization = collaborativeReasoning.visualize(result);
          console.error(visualization);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    sessionId: result.sessionId,
                    topic: result.topic,
                    stage: result.stage,
                    iteration: result.iteration,
                    personaCount: result.personas.length,
                    contributionCount: result.contributions.length,
                    disagreementCount: result.disagreements?.length || 0,
                    activePersonaId: result.activePersonaId,
                    nextPersonaId: result.nextPersonaId,
                    nextContributionNeeded: result.nextContributionNeeded,
                    suggestedContributionTypes: result.suggestedContributionTypes
                  },
                  null,
                  2
                )
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
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
    },
    onToolCall: async (_toolName: string, _args: unknown, result: ToolCallResult, error?: Error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      if (error || result.isError) {
        const firstContent = result.content[0];
        const errMsg = firstContent && "text" in firstContent ? firstContent.text : "unknown error";
        posthog.captureException(new Error(String(errMsg)), POSTHOG_ANONYMOUS_ID, {
          tool: "collaborativeReasoning"
        });
      } else {
        try {
          const parsed = JSON.parse(result.content[0].text);
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "collaborative reasoning contribution processed",
            properties: {
              session_id: parsed.sessionId,
              stage: parsed.stage,
              iteration: parsed.iteration,
              persona_count: parsed.personaCount,
              contribution_count: parsed.contributionCount,
              disagreement_count: parsed.disagreementCount,
              next_contribution_needed: parsed.nextContributionNeeded
            }
          });
        } catch {
          // If JSON parse fails, still track the event generically
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "collaborative reasoning contribution processed",
            properties: {}
          });
        }
      }
      await posthog.flush();
    }
  });
}
