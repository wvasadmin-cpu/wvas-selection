import "server-only";
import type { EmailMessage } from "./ack-email";

// Sends email from wvasmembersec@gmail.com through a small Google Apps Script
// published as a web app (see apps-script/SETUP.md), the same way the
// exhibition entry form's confirmations are sent. A shared secret stops anyone
// else using it.

export class MailerError extends Error {}

export function mailerConfigured(): boolean {
  return Boolean(process.env.EMAIL_RELAY_URL && process.env.EMAIL_RELAY_SECRET);
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const url = process.env.EMAIL_RELAY_URL;
  const secret = process.env.EMAIL_RELAY_SECRET;
  if (!url || !secret) throw new MailerError("Email isn't set up yet: EMAIL_RELAY_URL and EMAIL_RELAY_SECRET are needed.");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, ...message }),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !body?.ok) {
    throw new MailerError(`Email not sent (${body?.error ?? `status ${res.status}`}).`);
  }
}
