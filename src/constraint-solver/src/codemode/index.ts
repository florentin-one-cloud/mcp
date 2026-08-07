import { ConstraintProblem, ConstraintResult } from "../core/types.js";
import { solve } from "../core/logic.js";

/**
 * ConstraintSolver - Public API for constraint satisfaction checking.
 *
 * Purpose: Validates variable assignments against constraint expressions.
 * Limitations: Max 1000 variables, 5000 constraints. Sandboxed evaluation.
 * Workflow: 1) Provide variables and constraints 2) Call check() 3) Review results.
 */
export class ConstraintSolver {
  /**
   * Checks if a set of variables satisfies all constraints.
   *
   * @param input - The problem definition containing variables and constraints.
   * @returns A promise resolving to the result of the constraint check.
   */
  async check(input: ConstraintProblem): Promise<ConstraintResult> {
    return solve(input);
  }
}

import { codeMcpServer } from "@cloudflare/codemode/mcp";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Executor } from "@cloudflare/codemode";

/**
 * Create a Code Mode MCP server wrapper for ConstraintSolver.
 *
 * Wraps the ConstraintSolver API as tools inside an MCP server,
 * then bridges it with `codeMcpServer` so LLMs can call `codemode.constraintSolver(args)`
 * from the @cloudflare/codemode sandbox.
 *
 * @param executor - The codemode sandbox executor (e.g. DynamicWorkerExecutor).
 * @returns A Promise resolving to the bridged MCP server.
 */
export async function createCodeMcpServer(executor: Executor) {
  const api = new ConstraintSolver();

  const server = new Server(
    { name: "constraintSolver", version: "0.4.13" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "check",
      description: "Check if a set of variables satisfies all constraints",
      inputSchema: { type: "object" }
    }]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await api.check(request.params.arguments as unknown as ConstraintProblem);
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  });

  return codeMcpServer({
    server: server as unknown as Parameters<typeof codeMcpServer>[0]["server"],
    executor
  });
}
