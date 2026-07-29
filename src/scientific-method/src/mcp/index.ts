import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ScientificMethodCodeMode } from "../codemode/index.js";
import { SCIENTIFIC_METHOD_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Creates and configures the MCP server instance.
 *
 * **Architectural Role**:
 * This function acts as the **MCP Adapter Layer**. Its primary role is to bridge the
 * generic Model Context Protocol (MCP) with the specific business logic of the
 * Scientific Method Code Mode API.
 *
 * **Purpose**:
 * - **Protocol Adaptation**: It translates MCP tool calls (JSON-RPC requests) into
 *   method calls on the `ScientificMethodCodeMode` API.
 * - **Response Formatting**: It formats the results from the API into the standard
 *   MCP content structure (e.g., text blocks, error messages).
 * - **Error Handling**: It catches exceptions from the API and converts them into
 *   MCP-compliant error responses.
 *
 * **Communication Flow**:
 * 1. MCP Client sends `tools/list` -> Returns `scientificMethod` tool definition.
 * 2. MCP Client sends `tools/call` -> Adapter extracts arguments -> Calls `api.processInquiry`.
 * 3. Adapter receives result -> Formats as JSON text -> Sends response to Client.
 *
 * @returns A fully configured `Server` instance ready to connect to a transport.
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: "scientific-method-server",
      version: "0.4.9"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const api = new ScientificMethodCodeMode();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [SCIENTIFIC_METHOD_TOOL]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "scientificMethod") {
      const posthog = getPostHogClient();
      try {
        const result = await api.processInquiry(request.params.arguments);
        const visualization = api.visualize(result);
        console.error(visualization);

        if (posthog) {
          posthog.capture({
            distinctId: POSTHOG_ANONYMOUS_ID,
            event: "scientific inquiry advanced",
            properties: {
              inquiry_id: result.inquiryId,
              stage: result.stage,
              iteration: result.iteration,
              next_stage_needed: result.nextStageNeeded,
              has_hypothesis: !!result.hypothesis,
              has_conclusion: !!result.conclusion
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
                  inquiryId: result.inquiryId,
                  stage: result.stage,
                  iteration: result.iteration,
                  hasObservation: !!result.observation,
                  hasQuestion: !!result.question,
                  hasHypothesis: !!result.hypothesis,
                  hasExperiment: !!result.experiment,
                  hasAnalysis: !!result.analysis,
                  hasConclusion: !!result.conclusion,
                  nextStageNeeded: result.nextStageNeeded
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
            tool: "scientificMethod"
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
