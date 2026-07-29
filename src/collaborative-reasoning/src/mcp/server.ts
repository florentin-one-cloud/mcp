import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { CollaborativeReasoning } from "../codemode/index.js";
import { COLLABORATIVE_REASONING_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a collaborative reasoning MCP server instance.
 */
export default function createServer(): Server {
  const server = new Server(
    {
      name: "collaborative-reasoning-server",
      version: "0.4.16"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const collaborativeReasoning = new CollaborativeReasoning();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [COLLABORATIVE_REASONING_TOOL]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "collaborativeReasoning") {
      const posthog = getPostHogClient();
      try {
        const result = await collaborativeReasoning.collaborate(request.params.arguments);

        // Generate visualization
        const visualization = collaborativeReasoning.visualize(result);
        console.error(visualization);

        if (posthog) {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "collaborative reasoning contribution processed",
            properties: {
              session_id: result.sessionId,
              stage: result.stage,
              iteration: result.iteration,
              persona_count: result.personas.length,
              contribution_count: result.contributions.length,
              disagreement_count: result.disagreements?.length ?? 0,
              next_contribution_needed: result.nextContributionNeeded
            }
          });
          await posthog.flush();
        }

        return {
          content: [
            {
              type: "text",
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
        if (posthog) {
          posthog.captureException(error instanceof Error ? error : new Error(String(error)), POSTHOG_ANONYMOUS_ID, {
            tool: "collaborativeReasoning"
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
