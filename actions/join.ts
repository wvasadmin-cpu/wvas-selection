"use server";

import { AirtableError, createMemberRecord } from "@/lib/airtable";
import { ukToday } from "@/lib/intake";
import { toMemberFields, validateMembership, type MembershipInput } from "@/lib/membership";
import { associateAck } from "@/lib/ack-email";
import { mailerConfigured, sendEmail } from "@/lib/mailer";
import { saveApplyProblem } from "@/lib/store";

export type JoinResult = { ok: true; emailedTo?: string } | { ok: false; errors: Record<string, string>; message: string };

export async function submitMembershipAction(input: MembershipInput): Promise<JoinResult> {
  const checked = validateMembership(input);
  if (!checked.ok) {
    return { ok: false, errors: checked.errors, message: checked.errors.form ?? "Please check the highlighted answers." };
  }
  try {
    await createMemberRecord(toMemberFields(checked.application, { today: ukToday() }));
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

  // The application is saved; the acknowledgement email is a courtesy, so a
  // problem sending it is recorded for the admin but doesn't fail the application.
  if (!mailerConfigured()) return { ok: true };
  try {
    await sendEmail(associateAck(checked.application));
    return { ok: true, emailedTo: checked.application.email };
  } catch (e) {
    console.error(e);
    await saveApplyProblem({
      at: new Date().toISOString(),
      detail: `Associate acknowledgement email: ${e instanceof Error ? e.message : "unknown error"}`,
    }).catch(() => undefined);
  }
  return { ok: true };
}
