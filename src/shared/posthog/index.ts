import { PostHog } from "posthog-node";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { instrument } from "@posthog/mcp";

let _client: PostHog | null = null;
let _analyticsClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "POSTHOG_API_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_API_KEY is configured"
      );
    }
    return null;
  }

  if (!_client) {
    _client = new PostHog(apiKey, {
      host: host ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true
    });
  }

  return _client;
}

function getMcpAnalyticsClient(): PostHog | null {
  const token = process.env["mcp_POSTHOG_PROJECT_TOKEN"];
  const host = process.env.POSTHOG_HOST;

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "mcp-POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once mcp-POSTHOG_PROJECT_TOKEN is configured"
      );
    }
    return null;
  }

  if (!_analyticsClient) {
    _analyticsClient = new PostHog(token, {
      host: host ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true
    });
  }

  return _analyticsClient;
}

export function instrumentMcpServer(server: Server): void {
  const posthog = getMcpAnalyticsClient();
  if (posthog) {
    instrument(server, posthog);
  }
}

export async function shutdownMcpAnalytics(): Promise<void> {
  if (_analyticsClient) {
    await _analyticsClient.shutdown();
  }
}

export const POSTHOG_ANONYMOUS_ID = "mcp-server";
