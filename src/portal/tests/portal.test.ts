import { describe, expect, it } from "vitest";
import createPortalServer from "../src/portal-server.js";
import { BACKEND_SERVERS, getBackendForTool, getBackendUrl } from "../src/tool-router.js";

describe("Tool Router", () => {
  it("maps every backend tool name to the correct service", () => {
    expect(getBackendForTool("sequentialthinking")?.service).toBe("sequential-thinking");
    expect(getBackendForTool("collaborativeReasoning")?.service).toBe("collaborative-reasoning");
    expect(getBackendForTool("scientificMethod")?.service).toBe("scientific-method");
    expect(getBackendForTool("constraintSolver")?.service).toBe("constraint-solver");
    expect(getBackendForTool("metacognitiveMonitoring")?.service).toBe("metacognitive-monitoring");
    expect(getBackendForTool("narrativePlanner")?.service).toBe("narrative-planner");
    expect(getBackendForTool("structuredArgumentation")?.service).toBe("structured-argumentation");
  });

  it("returns undefined for unknown tools", () => {
    expect(getBackendForTool("nonexistent")).toBeUndefined();
  });

  it("throws if MCP_PORTAL_DOMAIN is not set", () => {
    const original = process.env["MCP_PORTAL_DOMAIN"];
    delete process.env["MCP_PORTAL_DOMAIN"];
    try {
      expect(() => getBackendUrl("test")).toThrow("MCP_PORTAL_DOMAIN");
    } finally {
      if (original) process.env["MCP_PORTAL_DOMAIN"] = original;
    }
  });

  it("constructs correct backend URLs", () => {
    process.env["MCP_PORTAL_DOMAIN"] = "example.workers.dev";
    expect(getBackendUrl("sequential-thinking")).toBe("https://sequential-thinking.example.workers.dev");
    delete process.env["MCP_PORTAL_DOMAIN"];
  });

  it("has 7 backend servers registered", () => {
    expect(BACKEND_SERVERS).toHaveLength(7);
  });

  it("every backend has at least one tool", () => {
    for (const backend of BACKEND_SERVERS) {
      expect(backend.tools.length).toBeGreaterThan(0);
    }
  });
});

describe("Portal Server", () => {
  it("creates a server instance", () => {
    const server = createPortalServer();
    expect(server).toBeDefined();
  });

  it("has server/discover handler registered", () => {
    const server = createPortalServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (server as any)._requestHandlers?.get?.("server/discover");
    expect(handler).toBeDefined();
    expect(typeof handler).toBe("function");
  });
});
