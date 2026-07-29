import { describe, expect, it, beforeEach } from "bun:test";
import createServer from "./mcp/server.js";
import { CollaborativeReasoning } from "./codemode/index.js";
import { MockTransport, extractToolList, extractContentText, isErrorResponse } from "../../shared/testing/mock-transport.js";

describe("Collaborative Reasoning Server", () => {
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
  it("should register collaborativeReasoning tool correctly", async () => {
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
    expect(tools[0].name).toBe("collaborativeReasoning");
    expect(tools[0].description).toBeDefined();
  });
});

describe("Input Validation", () => {
  let collaborativeReasoning: CollaborativeReasoning;

  beforeEach(() => {
    collaborativeReasoning = new CollaborativeReasoning();
  });

  it("should reject null input", async () => {
    let error;
    try {
      await collaborativeReasoning.collaborate(null);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });

  it("should reject input missing topic", async () => {
    const invalidInput = {
      personas: [],
      contributions: [],
      stage: "ideation",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: false
    };
    let error;
    try {
      await collaborativeReasoning.collaborate(invalidInput);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(String(error)).toContain("Invalid topic");
  });

  it("should reject input missing personas", async () => {
    const invalidInput = {
      topic: "Test Topic",
      contributions: [],
      stage: "ideation",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: false
    };
    let error;
    try {
      await collaborativeReasoning.collaborate(invalidInput);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(String(error)).toContain("Invalid personas");
  });

  it("should reject input missing contributions", async () => {
    const invalidInput = {
      topic: "Test Topic",
      personas: [],
      stage: "ideation",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: false
    };
    let error;
    try {
      await collaborativeReasoning.collaborate(invalidInput);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(String(error)).toContain("Invalid contributions");
  });

  it("should process valid input successfully", async () => {
    const validInput = {
      topic: "Should we adopt AI in our workflow?",
      personas: [
        {
          id: "persona1",
          name: "Technical Lead",
          expertise: ["Software Architecture", "AI/ML"],
          background: "10 years in software development",
          perspective: "Focus on technical feasibility",
          biases: ["Technology optimism"],
          communication: {
            style: "analytical",
            tone: "professional"
          }
        }
      ],
      contributions: [
        {
          personaId: "persona1",
          content: "AI adoption requires careful planning",
          type: "observation",
          confidence: 0.8
        }
      ],
      stage: "ideation",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: false
    };
    const result = await collaborativeReasoning.collaborate(validInput);
    expect(result).toBeDefined();
    expect(result.topic).toBe(validInput.topic);
  });
});

describe("Persona Management", () => {
  let collaborativeReasoning: CollaborativeReasoning;

  beforeEach(() => {
    collaborativeReasoning = new CollaborativeReasoning();
  });

  it("should handle multiple personas correctly", async () => {
    const input = {
      topic: "Technology Decision",
      personas: [
        {
          id: "tech",
          name: "Tech Lead",
          expertise: ["Engineering"],
          background: "Tech background",
          perspective: "Technical view",
          biases: ["Tech bias"],
          communication: { style: "direct", tone: "formal" }
        },
        {
          id: "biz",
          name: "Business Lead",
          expertise: ["Business"],
          background: "Business background",
          perspective: "Business view",
          biases: ["Cost bias"],
          communication: { style: "narrative", tone: "casual" }
        }
      ],
      contributions: [],
      stage: "problem-definition",
      activePersonaId: "tech",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: true
    };
    const result = await collaborativeReasoning.collaborate(input);
    expect(result).toBeDefined();
  });

  it("should rotate personas when nextPersonaId not specified", async () => {
    const input = {
      topic: "Decision Topic",
      personas: [
        {
          id: "p1",
          name: "Person 1",
          expertise: ["A"],
          background: "Background 1",
          perspective: "View 1",
          biases: [],
          communication: { style: "direct", tone: "formal" }
        },
        {
          id: "p2",
          name: "Person 2",
          expertise: ["B"],
          background: "Background 2",
          perspective: "View 2",
          biases: [],
          communication: { style: "direct", tone: "formal" }
        }
      ],
      contributions: [],
      stage: "ideation",
      activePersonaId: "p1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: true
    };
    const result = await collaborativeReasoning.collaborate(input);
    expect(result.nextPersonaId).toBe("p2");
  });
});

describe("MCP Server Integration", () => {
  it("server can be created without errors", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe("function");
    expect(typeof server.close).toBe("function");
  });

  it("handles valid collaborative reasoning request via MCP", async () => {
    const server = createServer();
    const transport = new MockTransport();
    await server.connect(transport);

    const response = await transport.sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "collaborativeReasoning",
        arguments: {
          topic: "Test Topic",
          personas: [
            {
              id: "p1",
              name: "Person 1",
              expertise: ["A"],
              background: "BG",
              perspective: "View",
              biases: [],
              communication: { style: "direct", tone: "formal" }
            }
          ],
          contributions: [],
          stage: "ideation",
          activePersonaId: "p1",
          sessionId: "s1",
          iteration: 1,
          nextContributionNeeded: false
        }
      }
    });

    expect(isErrorResponse(response)).toBe(false);
    const text = extractContentText(response);
    const parsed = JSON.parse(text);
    expect(parsed.topic).toBe("Test Topic");
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
});

describe("Edge Cases and Performance", () => {
  let collaborativeReasoning: CollaborativeReasoning;

  beforeEach(() => {
    collaborativeReasoning = new CollaborativeReasoning();
  });

  it("handles large number of contributions", async () => {
    const contributions = Array.from({ length: 100 }, (_, i) => ({
      personaId: "persona1",
      content: `Contribution ${i}`,
      type: "observation" as const,
      confidence: 0.8
    }));

    const input = {
      topic: "Large Discussion",
      personas: [
        {
          id: "persona1",
          name: "Contributor",
          expertise: ["General"],
          background: "Background",
          perspective: "Perspective",
          biases: [],
          communication: { style: "direct", tone: "formal" }
        }
      ],
      contributions,
      stage: "ideation",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: false
    };
    const result = await collaborativeReasoning.collaborate(input);
    expect(result).toBeDefined();
    expect(result.contributions.length).toBe(100);
  });

  it("handles empty contributions array gracefully", async () => {
    const input = {
      topic: "Empty Discussion",
      personas: [
        {
          id: "persona1",
          name: "Contributor",
          expertise: ["General"],
          background: "Background",
          perspective: "Perspective",
          biases: [],
          communication: { style: "direct", tone: "formal" }
        }
      ],
      contributions: [],
      stage: "problem-definition",
      activePersonaId: "persona1",
      sessionId: "session1",
      iteration: 1,
      nextContributionNeeded: true
    };
    const result = await collaborativeReasoning.collaborate(input);
    expect(result).toBeDefined();
    expect(result.contributions.length).toBe(0);
  });

  it("handles special characters in inputs", async () => {
    const input = {
      topic: "Special chars: @#$% & émojis 🎉",
      personas: [
        {
          id: "persona-1",
          name: "Person with 'quotes'",
          expertise: ["Test & Debug"],
          background: 'Background with "quotes"',
          perspective: "Perspective <html>",
          biases: ["Bias (parenthetical)"],
          communication: { style: "direct", tone: "formal" }
        }
      ],
      contributions: [
        {
          personaId: "persona-1",
          content: "Content with special chars: €£¥",
          type: "observation",
          confidence: 0.9
        }
      ],
      stage: "critique",
      activePersonaId: "persona-1",
      sessionId: "session-1",
      iteration: 1,
      nextContributionNeeded: false
    };
    const result = await collaborativeReasoning.collaborate(input);
    expect(result).toBeDefined();
    expect(result.topic).toContain("émojis");
  });
});
