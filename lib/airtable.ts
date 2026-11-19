import "server-only";
import { fieldsToRead } from "./airtable-fields";
import type { AirtableRecord } from "./applicants";

// Reads application records from Airtable with the read-only token. Only the
// fields in lib/airtable-fields.ts are requested.

export class AirtableError extends Error {}

function config() {
  const token = process.env.AIRTABLE_TOKEN ?? process.env.AIRTABLE_WRITE_TOKEN;
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

    // AIRTABLE_API_URL is only for local testing against a stand-in server.
    const res = await fetch(
      `${process.env.AIRTABLE_API_URL ?? "https://api.airtable.com"}/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?${params}`,
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

/**
 * Add one record to an Airtable table in the applications base. Uses a
 * separate token with write permission (the reading token stays read-only).
 * `typecast` lets Airtable match text to dropdown options and dates.
 */
async function createRecord(table: string, fields: Record<string, unknown>): Promise<string> {
  const token = process.env.AIRTABLE_WRITE_TOKEN;
  const { base } = config();
  if (!token) throw new AirtableError("Forms can't be saved yet: AIRTABLE_WRITE_TOKEN is not set.");

  const res = await fetch(
    `${process.env.AIRTABLE_API_URL ?? "https://api.airtable.com"}/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.type ? ` (${body.error.type}${body.error.message ? `: ${body.error.message}` : ""})` : "";
    } catch {
      // ignore unreadable bodies
    }
    throw new AirtableError(`Airtable returned ${res.status}${detail}.`);
  }
  const body = (await res.json()) as { records: { id: string }[] };
  return body.records[0]?.id ?? "";
}

/** Add one exhibitor application to the applications table. */
export function createApplicationRecord(fields: Record<string, unknown>): Promise<string> {
  return createRecord(config().table, fields);
}

/** Add one new associate member to the master membership table. */
export function createMemberRecord(fields: Record<string, unknown>): Promise<string> {
  const table = process.env.AIRTABLE_MEMBERS_TABLE;
  if (!table) throw new AirtableError("The membership form can't be saved yet: AIRTABLE_MEMBERS_TABLE is not set.");
  return createRecord(table, fields);
}
