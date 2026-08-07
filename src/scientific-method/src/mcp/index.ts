import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { createFlorentinMcpServer, type ToolCallResult, type ToolHandler } from "../../../shared/mcp-base/src/index.js";
import { ScientificMethodCodeMode } from "../codemode/index.js";
import { SCIENTIFIC_METHOD_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Creates and configures the MCP server instance via the shared Florentin One
 * factory, delegating tool registration, PostHog instrumentation, and
 * protocol discovery to `createFlorentinMcpServer`.
 *
 * Custom PostHog event capture ("scientific inquiry advanced") is moved into
 * the `onToolCall` hook, preserving the same event properties and flush
 * behavior as the previous manual implementation.
 *
 * @returns A fully configured `Server` instance ready to connect to a transport.
 */
export function createServer(): Server {
  const api = new ScientificMethodCodeMode();
  const posthog = getPostHogClient();

  const handleScientificMethod: ToolHandler = async (args, _meta) => {
    try {
      const result = await api.processInquiry(args);
      const visualization = api.visualize(result);
      console.error(visualization);

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
  };

  const onToolCall = async (
    toolName: string,
    args: unknown,
    result: ToolCallResult,
    error?: Error
  ) => {
    if (!posthog) return;

    if (error || result.isError) {
      const errorMessage = result.isError
        ? (result.content[0]?.text ?? "Unknown error")
        : error instanceof Error
          ? error.message
          : String(error);
      posthog.captureException(
        error instanceof Error ? error : new Error(String(errorMessage)),
        POSTHOG_ANONYMOUS_ID,
        { tool: toolName }
      );
    } else {
      const a = args as Record<string, unknown> | undefined;
      posthog.capture({
        distinctId: POSTHOG_ANONYMOUS_ID,
        event: "scientific inquiry advanced",
        properties: {
          inquiry_id: a?.inquiryId,
          stage: a?.stage,
          iteration: a?.iteration,
          next_stage_needed: a?.nextStageNeeded,
          has_hypothesis: !!(a as Record<string, unknown>)?.hypothesis,
          has_conclusion: !!(a as Record<string, unknown>)?.conclusion
        }
      });
    }
    await posthog.flush();
  };

  return createFlorentinMcpServer({
    name: "scientific-method-server",
    version: "0.4.13",
    tools: [SCIENTIFIC_METHOD_TOOL],
    toolHandlers: {
      scientificMethod: handleScientificMethod
    },
    onToolCall
  });
}
