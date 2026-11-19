"use server";

import { AirtableError, createMemberRecord } from "@/lib/airtable";
import { ukToday } from "@/lib/intake";
import { toMemberFields, validateMembership, type MembershipInput } from "@/lib/membership";
import { saveApplyProblem } from "@/lib/store";

export type JoinResult = { ok: true } | { ok: false; errors: Record<string, string>; message: string };

export async function submitMembershipAction(input: MembershipInput): Promise<JoinResult> {
  const checked = validateMembership(input);
  if (!checked.ok) {
    return { ok: false, errors: checked.errors, message: checked.errors.form ?? "Please check the highlighted answers." };
  }
  try {
    await createMemberRecord(toMemberFields(checked.application, { today: ukToday() }));
    return { ok: true };
  } catch (e) {
    const detail = e instanceof AirtableError ? e.message : e instanceof Error ? e.message : "Unknown error";
    console.error(detail);
    // Recorded for the admin's Applications page (not shown to applicants).
    await saveApplyProblem({ at: new Date().toISOString(), detail: `Membership form: ${detail}` }).catch(() => undefined);
    return {
      ok: false,
      errors: {},
      message: "Sorry, your application couldn't be sent just now. Please try again in a few minutes. Your answers are still here.",
    };
  }
}
