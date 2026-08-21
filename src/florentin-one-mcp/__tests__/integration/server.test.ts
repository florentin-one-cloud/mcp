import { createServer } from "../../src/agent/server.js";
import { assertMCPResponse } from "../../../shared/test-utils/index.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP Server Integration", () => {
  let server: ReturnType<typeof createServer>;

  beforeAll(() => {
    server = createServer();
  });

  // --- Tool registration ---

  it("registers all 7 tools", () => {
    const tools = server.getTools();
    const toolNames = Object.keys(tools).sort();
    const expectedTools = [
      "collaborativeReasoning",
      "constraintSolver",
      "metacognitiveMonitoring",
      "narrativePlanner",
      "scientificMethod",
      "sequentialthinking",
      "structuredArgumentation"
    ].sort();

    expect(toolNames).toEqual(expectedTools);
  });

  it("returns all 7 tool definitions with required fields", () => {
    const tools = server.getTools();

    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema).toBe("object");
    }
  });

  // --- metacognitiveMonitoring tool ---

  it("calling metacognitiveMonitoring with valid input returns a valid MCP response", async () => {
    const tools = server.getTools();
    const metacognitiveTool = tools["metacognitiveMonitoring"];
    expect(metacognitiveTool).toBeDefined();

    const params = {
      task: "integration test task",
      stage: "knowledge-assessment",
      overallConfidence: 0.8,
      uncertaintyAreas: ["test area"],
      recommendedApproach: "test approach",
      monitoringId: "mm-integration-20260821",
      iteration: 0,
      nextAssessmentNeeded: true
    };

    const result = await metacognitiveTool.handler(params);
    const parsed = assertMCPResponse(result);
    expect(parsed).toBeDefined();
    expect((parsed as Record<string, unknown>).monitoringId).toBe("mm-integration-20260821");
  });

  it("calling metacognitiveMonitoring with knowledgeAssessment returns valid response", async () => {
    const tools = server.getTools();
    const metacognitiveTool = tools["metacognitiveMonitoring"];

    const params = {
      task: "test with knowledge",
      stage: "knowledge-assessment",
      overallConfidence: 0.7,
      uncertaintyAreas: [],
      recommendedApproach: "test",
      monitoringId: "mm-ka-test",
      iteration: 0,
      nextAssessmentNeeded: false,
      knowledgeAssessment: {
        domain: "testing",
        knowledgeLevel: "proficient",
        confidenceScore: 0.7,
        supportingEvidence: "test evidence",
        knownLimitations: ["limitation1"]
      }
    };

    const result = await metacognitiveTool.handler(params);
    const parsed = assertMCPResponse(result);
    expect((parsed as Record<string, unknown>).hasKnowledgeAssessment).toBe(true);
  });

  // --- sequentialthinking tool ---

  it("calling sequentialthinking with valid input returns a valid MCP response", async () => {
    const tools = server.getTools();
    const sequentialTool = tools["sequentialthinking"];

    const params = {
      thought: "This is an integration test thought",
      thoughtNumber: 1,
      totalThoughts: 3,
      nextThoughtNeeded: true
    };

    const result = await sequentialTool.handler(params);
    const parsed = assertMCPResponse(result);
    expect((parsed as Record<string, unknown>).thoughtNumber).toBe(1);
  });

  // --- Error handling ---

  it("returns error for invalid metacognitiveMonitoring input", async () => {
    const tools = server.getTools();
    const metacognitiveTool = tools["metacognitiveMonitoring"];

    const params = {
      task: 123,
      stage: "knowledge-assessment",
      overallConfidence: 0.8,
      uncertaintyAreas: [],
      recommendedApproach: "test",
      monitoringId: "mm-error-test",
      iteration: 0,
      nextAssessmentNeeded: true
    };

    const result = await metacognitiveTool.handler(params);
    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).isError).toBe(true);
  });

  // --- Prompts ---

  it("registers prompts", () => {
    const prompts = server.getPrompts();
    const promptNames = Object.keys(prompts).sort();
    expect(promptNames).toContain("metacognitive-monitoring-workflow");
    expect(promptNames).toContain("metacognitive-reassessment");
  });
});