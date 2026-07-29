import { describe, expect, it } from "bun:test";
import createServer from "../../src/mcp/server.js";
import { SEQUENTIAL_THINKING_TOOL } from "../../src/mcp/tools.js";
import { MockTransport, extractToolList, extractContentText, isErrorResponse } from "../../../shared/testing/mock-transport.js";

describe("Sequential Thinking MCP Server", () => {
  it("server initializes successfully", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("server exports correct configuration", () => {
    const server = createServer();
    expect(typeof server.connect).toBe("function");
    expect(typeof server.close).toBe("function");
  });
});

describe("Tool Registration", () => {
  it("should advertise sequentialthinking tool", async () => {
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
    expect(tools[0].name).toBe("sequentialthinking");
    expect(tools[0].description).toBeDefined();
  });

  it("should have correct tool definition", () => {
    expect(SEQUENTIAL_THINKING_TOOL.name).toBe("sequentialthinking");
    expect(SEQUENTIAL_THINKING_TOOL.inputSchema.required).toContain("thought");
    expect(SEQUENTIAL_THINKING_TOOL.inputSchema.required).toContain("nextThoughtNeeded");
    expect(SEQUENTIAL_THINKING_TOOL.inputSchema.required).toContain("thoughtNumber");
    expect(SEQUENTIAL_THINKING_TOOL.inputSchema.required).toContain("totalThoughts");
  });
});

describe("MCP Server Integration", () => {
  it("handles valid thinking request", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "sequentialthinking",
        arguments: {
          thought: "Let me think about this step by step",
          thoughtNumber: 1,
          totalThoughts: 3,
          nextThoughtNeeded: true
        }
      }
    });

    expect(isErrorResponse(response)).toBe(false);
    const text = extractContentText(response);
    const parsed = JSON.parse(text);
    expect(parsed.thoughtNumber).toBe(1);
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
        name: "sequentialthinking",
        arguments: {
          thoughtNumber: 1,
          totalThoughts: 5,
          nextThoughtNeeded: true
          // Missing required "thought" field
        }
      }
    });

    expect(isErrorResponse(response)).toBe(true);
  });

  it("handles thought revision via MCP", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    // First thought
    await transport.sendRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "sequentialthinking",
        arguments: {
          thought: "Initial thought",
          thoughtNumber: 1,
          totalThoughts: 2,
          nextThoughtNeeded: true
        }
      }
    });

    // Revision
    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "sequentialthinking",
        arguments: {
          thought: "Revised thought",
          thoughtNumber: 2,
          totalThoughts: 2,
          nextThoughtNeeded: false,
          isRevision: true,
          revisesThought: 1
        }
      }
    });

    expect(isErrorResponse(response)).toBe(false);
    const text = extractContentText(response);
    const parsed = JSON.parse(text);
    expect(parsed.isRevision).toBe(true);
    expect(parsed.revisesThought).toBe(1);
  });
});
