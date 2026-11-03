import "server-only";
import { fieldsToRead } from "./airtable-fields";
import type { AirtableRecord } from "./applicants";

// Reads application records from Airtable with the read-only token. Only the
// fields in lib/airtable-fields.ts are requested.

export class AirtableError extends Error {}

function config() {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE;
  if (!token || !base || !table) {
    throw new AirtableError("Airtable isn't set up yet: AIRTABLE_TOKEN, AIRTABLE_BASE_ID and AIRTABLE_TABLE are needed.");
  }
  return { token, base, table };
}

export async function fetchApplicationRecords(): Promise<AirtableRecord[]> {
  const { token, base, table } = config();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    for (const field of fieldsToRead()) params.append("fields[]", field);
    if (offset) params.set("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?${params}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );

    if (!res.ok) {
      // Airtable's error type (e.g. UNKNOWN_FIELD_NAME) helps diagnose without exposing the token.
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.error?.type ? ` (${body.error.type}${body.error.message ? `: ${body.error.message}` : ""})` : "";
      } catch {
        // ignore unreadable bodies
      }
      throw new AirtableError(`Airtable returned ${res.status}${detail}.`);
    }

    const page = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}
