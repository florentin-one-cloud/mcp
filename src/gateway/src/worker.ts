const ROUTE_MAP: Record<string, string> = {
  "collaborative-reasoning": "COLLABORATIVE_REASONING",
  "constraint-solver": "CONSTRAINT_SOLVER",
  "metacognitive-monitoring": "METACOGNITIVE_MONITORING",
  "narrative-planner": "NARRATIVE_PLANNER",
  "scientific-method": "SCIENTIFIC_METHOD",
  "sequential-thinking": "SEQUENTIAL_THINKING",
  "structured-argumentation": "STRUCTURED_ARGUMENTATION"
};

interface ServiceBinding {
  fetch: (request: Request) => Promise<Response>;
}

interface Env {
  [key: string]: ServiceBinding;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const serverName = pathSegments[0];

    if (!serverName || !ROUTE_MAP[serverName]) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          available: Object.keys(ROUTE_MAP)
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const bindingName = ROUTE_MAP[serverName];
    const binding = env[bindingName];
    return binding.fetch(request);
  }
};
