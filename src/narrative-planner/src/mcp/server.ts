import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema, CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { NarrativePlanner } from "../codemode/index.js";
import { NARRATIVE_PLANNER_TOOL } from "./tools.js";
import { NarrativeInput } from "../core/types.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

export class NarrativePlannerServer {
  private planner: NarrativePlanner;

  constructor() {
    this.planner = new NarrativePlanner();
  }

  async process(input: unknown) {
    try {
      // The planner validates inside, but we can also rely on Schema validation to some extent
      // However, the planner's validateNarrativeInput throws errors which we should catch
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

export default function createServer(): Server {
  const server = new Server({ name: "narrative-planner-server", version: " 0.4.10" }, { capabilities: { tools: {} } });
  const narrativeServer = new NarrativePlannerServer();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [NARRATIVE_PLANNER_TOOL] }));
  server.setRequestHandler(CallToolRequestSchema, async (req: CallToolRequest) => {
    if (req.params.name === "narrativePlanner") {
      const posthog = getPostHogClient();
      const result = await narrativeServer.process(req.params.arguments ?? {});

      if (posthog) {
        if (result.isError) {
          posthog.captureException(
            new Error(String(result.content[0]?.text ?? "unknown error")),
            POSTHOG_ANONYMOUS_ID,
            {
              tool: "narrativePlanner"
            }
          );
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

      return result;
    }
    return { content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }], isError: true };
  });

  return server;
}
