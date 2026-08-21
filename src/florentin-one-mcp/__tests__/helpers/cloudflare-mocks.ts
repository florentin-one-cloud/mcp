import { Miniflare } from "miniflare";

/**
 * Creates a Miniflare instance with in-memory KV, R2, and D1 simulation.
 * The instance runs a minimal no-op worker to host the bindings.
 */
export async function createMiniflareInstance(): Promise<Miniflare> {
  const mf = new Miniflare({
    workers: [
      {
        config: {
          modules: true,
          compatibilityDate: "2025-01-01",
          compatibilityFlags: ["nodejs_compat"],
          script: "export default { fetch() { return new Response('ok'); } }",
          kvNamespaces: ["TEST_KV"],
          r2Buckets: ["TEST_R2"],
          d1Databases: ["TEST_D1"]
        }
      }
    ]
  });
  return mf;
}

/**
 * Returns a KV namespace mock from the Miniflare instance.
 */
export async function getMockKV(miniflare: Miniflare): Promise<KVNamespace> {
  return miniflare.getKVNamespace("TEST_KV");
}

/**
 * Returns an R2 bucket mock from the Miniflare instance.
 */
export async function getMockR2(miniflare: Miniflare): Promise<R2Bucket> {
  return miniflare.getR2Bucket("TEST_R2");
}

/**
 * Returns a D1 database mock from the Miniflare instance.
 */
export async function getMockD1(miniflare: Miniflare): Promise<D1Database> {
  return miniflare.getD1Database("TEST_D1");
}