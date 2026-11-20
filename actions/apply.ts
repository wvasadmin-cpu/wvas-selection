"use server";

import { AirtableError, createApplicationRecord } from "@/lib/airtable";
import { toAirtableFields, validateApplication, type ApplicationInput } from "@/lib/application";
import { intakeStatus, ukToday } from "@/lib/intake";
import { exhibitorAck } from "@/lib/ack-email";
import { mailerConfigured, sendEmail } from "@/lib/mailer";
import { getIntake, saveApplyProblem, uploadExists } from "@/lib/store";

export type ApplyResult = { ok: true } | { ok: false; errors: Record<string, string>; message: string };

function siteUrl() {
  return (process.env.AUTH_URL ?? "https://wvas-selection.netlify.app").replace(/\/$/, "");
}

export async function submitApplicationAction(input: ApplicationInput): Promise<ApplyResult> {
  const intake = await getIntake();
  if (intakeStatus(intake) !== "open" || !intake) {
    return { ok: false, errors: {}, message: "Sorry, applications are closed." };
  }

  const checked = validateApplication(input);
  if (!checked.ok) {
    return { ok: false, errors: checked.errors, message: checked.errors.form ?? "Please check the highlighted answers." };
  }

  // Every photo must have arrived safely before the application is sent.
  const missing = await Promise.all(checked.application.artworks.map(async (a) => !(await uploadExists(a.photoId))));
  const errors: Record<string, string> = {};
  missing.forEach((m, i) => {
    if (m) errors[`photo${i}`] = "This photo didn't upload properly. Please add it again.";
  });
  if (Object.keys(errors).length) return { ok: false, errors, message: "Please add the highlighted photos again." };

  try {
    await createApplicationRecord(
      toAirtableFields(checked.application, {
        roundName: intake.roundName,
        today: ukToday(),
        photoUrl: (id) => `${siteUrl()}/api/uploads/${id}`,
      }),
    );
  } catch (e) {
    console.error(e instanceof AirtableError ? e.message : e);
    // Record the reason for the admin's Applications page (not shown to applicants).
    await saveApplyProblem({
      at: new Date().toISOString(),
      detail: e instanceof AirtableError ? e.message : e instanceof Error ? e.message : "Unknown error",
    }).catch(() => undefined);
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
    await sendEmail(
      exhibitorAck(checked.application, {
        roundName: intake.roundName,
        closesOn: intake.closesOn,
        viewing: intake.viewing,
        today: ukToday(),
        thumbUrl: (id) => `${siteUrl()}/api/uploads/${id}?size=thumb`,
      }),
    );
  } catch (e) {
    console.error(e);
    await saveApplyProblem({
      at: new Date().toISOString(),
      detail: `Exhibitor acknowledgement email: ${e instanceof Error ? e.message : "unknown error"}`,
    }).catch(() => undefined);
  }
  return { ok: true };
}
