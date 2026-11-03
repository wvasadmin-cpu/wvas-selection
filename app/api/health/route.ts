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
  const checks = [
    await timed("eventual get", () => getStore("wvas-selection").get("health-check")),
    await timed("strong get", () => getStore({ name: "wvas-selection", consistency: "strong" }).get("health-check")),
    await timed("eventual set", () => getStore("wvas-selection").set("health-check", new Date().toISOString())),
  ];
  return Response.json({ env, checks });
}
