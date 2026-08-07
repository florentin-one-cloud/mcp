import { describe, it, expect } from "vitest";
import {
  createFlorentinMcpServer,
  validateProtocolVersion,
  MCP_PROTOCOL_VERSION,
  MCP_ERROR_CODES
} from "./index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const sampleTool: Tool = {
  name: "testTool",
  description: "A test tool",
  inputSchema: {
    type: "object",
    properties: { input: { type: "string" } },
    required: ["input"]
  }
};

/**
 * Build a minimal JSON-RPC request object that the SDK's `parseWithCompat`
 * will accept. We need `method`, `jsonrpc`, `params`, and `id` at minimum.
 */
function makeMcpRequest(method: string, params: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: 1,
    method,
    params
  };
}

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

describe("MCP_ERROR_CODES", () => {
  it("defines HEADER_MISMATCH as -32020", () => {
    expect(MCP_ERROR_CODES.HEADER_MISMATCH).toBe(-32020);
  });

  it("defines MISSING_REQUIRED_CLIENT_CAPABILITY as -32021", () => {
    expect(MCP_ERROR_CODES.MISSING_REQUIRED_CLIENT_CAPABILITY).toBe(-32021);
  });

  it("defines UNSUPPORTED_PROTOCOL_VERSION as -32022", () => {
    expect(MCP_ERROR_CODES.UNSUPPORTED_PROTOCOL_VERSION).toBe(-32022);
  });

  it("exports MCP_PROTOCOL_VERSION as 2026-07-28", () => {
    expect(MCP_PROTOCOL_VERSION).toBe("2026-07-28");
  });
});

// ---------------------------------------------------------------------------
// validateProtocolVersion
// ---------------------------------------------------------------------------

describe("validateProtocolVersion", () => {
  it("returns valid for undefined meta", () => {
    const result = validateProtocolVersion(undefined);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns valid for empty meta", () => {
    const result = validateProtocolVersion({});
    expect(result.valid).toBe(true);
  });

  it("returns valid when protocol version matches", () => {
    const result = validateProtocolVersion({
      "io.modelcontextprotocol/protocolVersion": "2026-07-28"
    });
    expect(result.valid).toBe(true);
  });

  it("returns valid when no protocol version key in meta", () => {
    const result = validateProtocolVersion({
      "io.modelcontextprotocol/clientCapabilities": {}
    });
    expect(result.valid).toBe(true);
  });

  it("returns invalid for older protocol version", () => {
    const result = validateProtocolVersion({
      "io.modelcontextprotocol/protocolVersion": "2024-11-05"
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported protocol version");
    expect(result.error).toContain("2024-11-05");
    expect(result.error).toContain("2026-07-28");
  });

  it("returns invalid for future protocol version", () => {
    const result = validateProtocolVersion({
      "io.modelcontextprotocol/protocolVersion": "2027-01-01"
    });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Helper: locate a handler by method string from the internal map
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHandlerByMethod(server: any, method: string): ((req: any) => Promise<any>) | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = server._requestHandlers as Map<string, (req: any) => Promise<any>>;
  return handlers.get(method);
}

// ---------------------------------------------------------------------------
// createFlorentinMcpServer – structure & behavior
// ---------------------------------------------------------------------------

describe("createFlorentinMcpServer", () => {
  it("creates a server instance without throwing", () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [],
      toolHandlers: {}
    });
    expect(server).toBeDefined();
    expect(typeof server).toBe("object");
  });

  it("registers server/discover handler", () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) }
    });

    const discoverHandler = getHandlerByMethod(server, "server/discover");
    expect(discoverHandler).toBeDefined();
  });

  it("registers tools/list handler", () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) }
    });

    const listHandler = getHandlerByMethod(server, "tools/list");
    expect(listHandler).toBeDefined();
  });

  it("registers tools/call handler", () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();
  });

  it("server/discover returns protocol info", async () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "2.0.0",
      tools: [],
      toolHandlers: {}
    });

    const handler = getHandlerByMethod(server, "server/discover");
    expect(handler).toBeDefined();
    const result = await handler!(makeMcpRequest("server/discover"));

    expect(result.protocolVersions).toEqual(["2026-07-28"]);
    expect(result.capabilities).toEqual({ tools: {} });
    expect(result.serverInfo).toEqual({ name: "test-server", version: "2.0.0" });
  });

  it("tools/list returns tools with cache metadata", async () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: {}
    });

    const handler = getHandlerByMethod(server, "tools/list");
    expect(handler).toBeDefined();
    const result = await handler!(makeMcpRequest("tools/list"));

    expect(result.tools).toEqual([sampleTool]);
    expect(result.resultType).toBe("complete");
    expect(result.ttlMs).toBe(300000);
    expect(result.cacheScope).toBe("public");
  });

  it("runs a registered tool handler successfully", async () => {
    let handlerCalled = false;
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: {
        testTool: async (args) => {
          handlerCalled = true;
          return { content: [{ type: "text", text: `input: ${(args as Record<string, unknown>).input}` }] };
        }
      }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    const result = await callHandler!(
      makeMcpRequest("tools/call", {
        name: "testTool",
        arguments: { input: "hello" },
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
      })
    );

    expect(handlerCalled).toBe(true);
    expect(result.content[0].text).toBe("input: hello");
    expect(result.resultType).toBe("complete");
    expect(result._meta["io.modelcontextprotocol/serverInfo"]).toEqual({
      name: "test-server",
      version: "1.0.0"
    });
  });

  it("returns error for unknown tool", async () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    const result = await callHandler!(
      makeMcpRequest("tools/call", {
        name: "nonExistentTool",
        arguments: {},
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
      })
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unknown tool");
    expect(result.resultType).toBe("complete");
  });

  it("returns error for unsupported protocol version", async () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    const result = await callHandler!(
      makeMcpRequest("tools/call", {
        name: "testTool",
        arguments: { input: "hello" },
        _meta: { "io.modelcontextprotocol/protocolVersion": "2024-11-05" }
      })
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unsupported protocol version");
    expect(result.content[0].text).toContain("2024-11-05");
    expect(result.resultType).toBe("complete");
  });

  it("handles thrown errors in tool handler gracefully", async () => {
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: {
        testTool: async () => {
          throw new Error("handler explosion");
        }
      }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    const result = await callHandler!(
      makeMcpRequest("tools/call", {
        name: "testTool",
        arguments: {},
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
      })
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("handler explosion");
    expect(result.resultType).toBe("complete");
  });

  it("calls onToolCall hook after successful invocation", async () => {
    let hookCalled = false;
    let hookToolName = "";
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: { testTool: async () => ({ content: [{ type: "text", text: "ok" }] }) },
      onToolCall: async (toolName) => {
        hookCalled = true;
        hookToolName = toolName;
      }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    await callHandler!(
      makeMcpRequest("tools/call", {
        name: "testTool",
        arguments: {},
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
      })
    );

    expect(hookCalled).toBe(true);
    expect(hookToolName).toBe("testTool");
  });

  it("calls onToolCall hook with error on handler failure", async () => {
    let hookError: Error | undefined;
    const server = createFlorentinMcpServer({
      name: "test-server",
      version: "1.0.0",
      tools: [sampleTool],
      toolHandlers: {
        testTool: async () => {
          throw new Error("handler failure");
        }
      },
      onToolCall: async (_toolName, _args, _result, error) => {
        hookError = error;
      }
    });

    const callHandler = getHandlerByMethod(server, "tools/call");
    expect(callHandler).toBeDefined();

    await callHandler!(
      makeMcpRequest("tools/call", {
        name: "testTool",
        arguments: {},
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" }
      })
    );

    expect(hookError).toBeDefined();
    expect(hookError?.message).toBe("handler failure");
  });
});
