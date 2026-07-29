import { describe, expect, it } from "bun:test";
import { createServer } from "../../src/mcp/server.js";
import { MockTransport, extractToolList, extractContentText, isErrorResponse } from "../../../shared/testing/mock-transport.js";

describe("Metacognitive Monitoring Server", () => {
  it("server initializes successfully", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe("function");
    expect(typeof server.close).toBe("function");
  });
});

describe("Tool Registration", () => {
  it("should advertise metacognitiveMonitoring tool", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    });

    const tools = extractToolList(response);
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("metacognitiveMonitoring");
    expect(tools[0].description).toBeDefined();
  });
});

describe("MCP Server Integration", () => {
  it("handles valid monitoring request", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "metacognitiveMonitoring",
        arguments: {
          task: "Test task",
          stage: "planning",
          overallConfidence: 0.8,
          uncertaintyAreas: [],
          recommendedApproach: "Test",
          monitoringId: "id1",
          iteration: 0,
          nextAssessmentNeeded: false
        }
      }
    });

    expect(isErrorResponse(response)).toBe(false);
    const text = extractContentText(response);
    const parsed = JSON.parse(text);
    expect(parsed.task).toBe("Test task");
  });

  it("rejects unknown tool name", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "unknownTool",
        arguments: {}
      }
    });

    expect(isErrorResponse(response)).toBe(true);
  });

  it("returns error for invalid input via MCP", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "metacognitiveMonitoring",
        arguments: {
          task: "Test task"
          // Missing required fields
        }
      }
    });

    expect(isErrorResponse(response)).toBe(true);
  });
});

describe("Prompts", () => {
  it("should list prompts", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "prompts/list"
    });

    if ("result" in response) {
      const result = response.result as { prompts: Array<{ name: string }> };
      expect(result.prompts).toHaveLength(2);
      expect(result.prompts[0].name).toBe("metacognitive-monitoring-workflow");
      expect(result.prompts[1].name).toBe("metacognitive-reassessment");
    }
  });

  it("should get metacognitive-monitoring-workflow prompt", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "prompts/get",
      params: {
        name: "metacognitive-monitoring-workflow",
        arguments: {
          task: "Analyze code quality",
          domain: "Software Engineering"
        }
      }
    });

    if ("result" in response) {
      const result = response.result as { messages: Array<{ content: { text: string } }> };
      expect(result.messages[0].content.text).toContain("METACOGNITIVE MONITORING");
      expect(result.messages[0].content.text).toContain("Analyze code quality");
    }
  });

  it("should reject workflow prompt missing required task argument", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "prompts/get",
      params: {
        name: "metacognitive-monitoring-workflow",
        arguments: {}
      }
    });

    expect(isErrorResponse(response)).toBe(true);
  });
});
