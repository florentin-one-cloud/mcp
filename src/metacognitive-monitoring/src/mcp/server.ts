import { createFlorentinMcpServer } from "../../../shared/mcp-base/src/index.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { MetacognitiveAnalyzer } from "../core/analyzer.js";
import { MetacognitiveFormatter } from "../core/formatter.js";
import { METACOGNITIVE_MONITORING_TOOL } from "./tools.js";
import { getPostHogClient, POSTHOG_ANONYMOUS_ID } from "../../../shared/posthog/index.js";

/**
 * Factory function that creates and configures a metacognitive monitoring MCP server instance.
 *
 * Uses the shared `createFlorentinMcpServer` factory which handles server instantiation,
 * PostHog instrumentation, tool listing, and tool dispatch. Custom PostHog analytics events
 * (metacognitive assessment completed / captureException) are captured via the `onToolCall` hook.
 * Prompt handlers are registered separately as the factory does not manage prompts.
 *
 * @returns A configured Server instance ready for MCP communication
 */
export function createServer() {
  const analyzer = new MetacognitiveAnalyzer();

  const server = createFlorentinMcpServer({
    name: "metacognitive-monitoring-server",
    version: "0.4.13",
    tools: [METACOGNITIVE_MONITORING_TOOL],
    capabilities: { prompts: {} },
    toolHandlers: {
      metacognitiveMonitoring: async (args: unknown) => {
        try {
          const { data, result } = analyzer.process(args);

          // Generate visualization for server logs
          const visualization = MetacognitiveFormatter.visualize(data);
          console.error(visualization);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
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
      }
    },
    onToolCall: async (toolName, args, result, error) => {
      const posthog = getPostHogClient();
      if (!posthog) return;

      if (error || result.isError) {
        const firstContent = result.content[0];
        const errMsg = firstContent && "text" in firstContent ? firstContent.text : "unknown error";
        posthog.captureException(new Error(String(errMsg)), POSTHOG_ANONYMOUS_ID, {
          tool: toolName
        });
      } else {
        const data = args as Record<string, unknown>;
        posthog.capture({
          distinctId: POSTHOG_ANONYMOUS_ID,
          event: "metacognitive assessment completed",
          properties: {
            stage: data.stage,
            monitoring_id: data.monitoringId,
            iteration: data.iteration,
            overall_confidence: data.overallConfidence
          }
        });
      }
      await posthog.flush();
    }
  });

  // Register prompt handlers (prompts are not managed by the factory)
  const METACOGNITIVE_PROMPTS = [
    {
      name: "metacognitive-monitoring-workflow",
      title: "Begin Metacognitive Monitoring (Mandatory First Step)",
      description:
        "MANDATORY: Execute metacognitive self-assessment before starting any task. " +
        "This prompt establishes the metacognitive monitoring workflow that MUST run first in every conversation. " +
        "The LLM will assess its knowledge boundaries, classify claims, monitor reasoning quality, " +
        "and calibrate confidence before proceeding with any analysis or action.",
      arguments: [
        {
          name: "task",
          description: "The task or question being addressed",
          required: true
        },
        {
          name: "domain",
          description: "The primary knowledge domain relevant to this task",
          required: false
        }
      ]
    },
    {
      name: "metacognitive-reassessment",
      title: "Re-assess Metacognitive State",
      description:
        "Trigger a follow-up metacognitive assessment when the domain, complexity, or confidence level changes. " +
        "Must be used whenever new claims are made, reasoning shifts, or uncertainty emerges.",
      arguments: [
        {
          name: "monitoringId",
          description: "The monitoring session ID from a previous assessment",
          required: true
        },
        {
          name: "trigger",
          description: "What changed to warrant re-assessment (e.g., new domain, new evidence, complexity increase)",
          required: true
        }
      ]
    }
  ];

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: METACOGNITIVE_PROMPTS
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;

    if (promptName === "metacognitive-monitoring-workflow") {
      const args = (request.params.arguments as Record<string, string> | undefined) || {};
      if (!args.task) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Required argument "task" is missing for prompt "metacognitive-monitoring-workflow"'
        );
      }
      const task = args.task;
      const domain = args.domain || "the relevant domain";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `MANDATORY METACOGNITIVE MONITORING WORKFLOW\n` +
                `===========================================\n\n` +
                `Before you respond to the user or perform any analysis, you MUST first call the ` +
                `\`metacognitiveMonitoring\` tool with the following assessment:\n\n` +
                `Task: ${task}\n` +
                `Domain: ${domain}\n\n` +
                `STEP 1 — Knowledge Assessment (stage: "knowledge-assessment"):\n` +
                `- Assess your knowledge level in ${domain}\n` +
                `- Identify strengths, limitations, and training cutoff relevance\n` +
                `- Calibrate confidence based on evidence\n\n` +
                `STEP 2 — Planning (stage: "planning"):\n` +
                `- Based on your knowledge assessment, plan your approach\n` +
                `- Identify areas where confidence is low and flag them\n\n` +
                `STEP 3 — Execution (stage: "execution"):\n` +
                `- Classify each significant claim as fact/inference/speculation/uncertain\n` +
                `- Monitor reasoning quality for biases and assumptions\n\n` +
                `STEP 4 — Evaluation (stage: "evaluation"):\n` +
                `- Evaluate overall confidence in conclusions\n` +
                `- Identify uncertainty areas and recommend next steps\n\n` +
                `CRITICAL: Do NOT skip this workflow. It is mandatory for reliable and transparent reasoning.`
            }
          }
        ]
      };
    }

    if (promptName === "metacognitive-reassessment") {
      const args = (request.params.arguments as Record<string, string> | undefined) || {};
      if (!args.monitoringId) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Required argument "monitoringId" is missing for prompt "metacognitive-reassessment"'
        );
      }
      if (!args.trigger) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Required argument "trigger" is missing for prompt "metacognitive-reassessment"'
        );
      }
      const monitoringId = args.monitoringId;
      const trigger = args.trigger;

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `METACOGNITIVE RE-ASSESSMENT REQUIRED\n` +
                `===================================\n\n` +
                `A re-assessment is needed because: ${trigger}\n` +
                `Previous monitoring session: ${monitoringId}\n\n` +
                `Call the \`metacognitiveMonitoring\` tool again with:\n` +
                `- monitoringId: "${monitoringId}"\n` +
                `- iteration: (previous iteration + 1)\n` +
                `- Updated stage, confidence, and assessments based on what changed\n\n` +
                `This ensures your metacognitive state stays calibrated as the task evolves.`
            }
          }
        ]
      };
    }

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Unknown prompt: ${promptName}`
          }
        }
      ],
      isError: true
    };
  });

  return server;
}
