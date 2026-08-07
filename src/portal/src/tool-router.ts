/**
 * Tool name → backend service name routing table.
 *
 * Maps every known MCP tool to the server that owns it. The backend URL
 * is constructed at runtime from the `MCP_PORTAL_DOMAIN` environment variable:
 *   https://<service-name>.<MCP_PORTAL_DOMAIN>
 *
 * If MCP_PORTAL_DOMAIN is not set, requests will fail with a clear error.
 */

/** Backend servers with their service name and owned tools. */
export interface BackendInfo {
  /** Service name used in the workers.dev subdomain */
  service: string;
  /** Display name for server/discover */
  displayName: string;
  /** Tool names owned by this backend */
  tools: string[];
}

/** All 7 backend reasoning servers. */
export const BACKEND_SERVERS: BackendInfo[] = [
  {
    service: "sequential-thinking",
    displayName: "Sequential Thinking Server",
    tools: ["sequentialthinking"]
  },
  {
    service: "collaborative-reasoning",
    displayName: "Collaborative Reasoning Server",
    tools: ["collaborativeReasoning"]
  },
  {
    service: "scientific-method",
    displayName: "Scientific Method Server",
    tools: ["scientificMethod"]
  },
  {
    service: "constraint-solver",
    displayName: "Constraint Solver Server",
    tools: ["constraintSolver"]
  },
  {
    service: "metacognitive-monitoring",
    displayName: "Metacognitive Monitoring Server",
    tools: ["metacognitiveMonitoring"]
  },
  {
    service: "narrative-planner",
    displayName: "Narrative Planner Server",
    tools: ["narrativePlanner"]
  },
  {
    service: "structured-argumentation",
    displayName: "Structured Argumentation Server",
    tools: ["structuredArgumentation"]
  }
];

/** Tool name → backend info lookup (built once from BACKEND_SERVERS). */
const TOOL_MAP = new Map<string, BackendInfo>();
for (const backend of BACKEND_SERVERS) {
  for (const tool of backend.tools) {
    TOOL_MAP.set(tool, backend);
  }
}

/**
 * Returns the backend that owns the given tool, or undefined.
 */
export function getBackendForTool(toolName: string): BackendInfo | undefined {
  return TOOL_MAP.get(toolName);
}

/**
 * Build the backend URL for the given service name.
 * Uses the MCP_PORTAL_DOMAIN env var (e.g. `florentin-one.workers.dev`).
 */
export function getBackendUrl(service: string): string {
  const domain = getPortalDomain();
  return `https://${service}.${domain}`;
}

/**
 * Resolve the MCP_PORTAL_DOMAIN from environment.
 * Throws if not configured — the portal cannot route without it.
 */
export function getPortalDomain(): string {
  const domain = process.env["MCP_PORTAL_DOMAIN"];
  if (!domain) {
    throw new Error(
      "MCP_PORTAL_DOMAIN environment variable is required. " +
        "Set it to your workers.dev subdomain (e.g. florentin-one.workers.dev)."
    );
  }
  return domain;
}
