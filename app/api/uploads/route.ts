import { randomBytes } from "node:crypto";
import { normaliseUpload } from "@/lib/images";
import { intakeStatus } from "@/lib/intake";
import { getIntake, saveUpload } from "@/lib/store";

// Receives one artwork photo from the application form (already shrunk in the
// browser), checks it's a real image, stores it, and returns an id. Only
// accepted while applications are open.
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (intakeStatus(await getIntake()) !== "open") {
    return Response.json({ error: "Applications are closed." }, { status: 403 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return Response.json({ error: "No photo received." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That photo is too large (8 MB maximum)." }, { status: 413 });

  let jpeg: Buffer;
  try {
    jpeg = await normaliseUpload(Buffer.from(await file.arrayBuffer()));
  } catch {
    return Response.json({ error: "That file couldn't be read as a photo. Please choose a JPEG or PNG." }, { status: 415 });
  }
  const id = randomBytes(18).toString("base64url");
  await saveUpload(id, jpeg);
  return Response.json({ id });
}
