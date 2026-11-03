import { getStore } from "@netlify/blobs";

// Temporary storage diagnostic: reports only success/failure and timings.
export const dynamic = "force-dynamic";

async function timed(label: string, fn: () => Promise<unknown>) {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out after 8s")), 8000)),
    ]);
    return { label, ok: true, ms: Date.now() - start, result: result === null ? "null" : typeof result };
  } catch (e) {
    return { label, ok: false, ms: Date.now() - start, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

export async function GET() {
  const env = {
    NETLIFY_BLOBS_CONTEXT: !!process.env.NETLIFY_BLOBS_CONTEXT,
    NETLIFY: process.env.NETLIFY ?? null,
    SITE_ID: !!process.env.SITE_ID,
    DEPLOY_ID: !!process.env.DEPLOY_ID,
  };
  const checks = await Promise.all([
    timed("eventual get", () => getStore("wvas-selection").get("health-check")),
    timed("strong get", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("health-check")),
    timed("eventual set", () => getStore("wvas-selection").set("health-check", new Date().toISOString())),
    timed("strong get missing json", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("no-such-key", { type: "json" })),
    timed("strong get missing plain", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("no-such-key")),
    timed("strong get slash missing", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("round/no-such")),
    timed("strong set slash", () => getStore({ name: "wvas-selection", consistency: "strong" }).setJSON("health/slash", { ok: 1 })),
    timed("strong get slash json", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("health/slash", { type: "json" })),
    timed("eventual get missing", () => getStore("wvas-selection").get("no-such-key")),
  ]);
  return Response.json({ env, checks });
}
