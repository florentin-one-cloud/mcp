import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

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

export const POSTHOG_ANONYMOUS_ID = "mcp-server";
