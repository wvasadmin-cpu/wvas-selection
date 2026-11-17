"use client";

import { useActionState } from "react";
import { saveIntakeAction, type IntakeFormState } from "@/actions/intake";
import type { Intake } from "@/lib/intake";

export default function IntakeForm({ intake }: { intake: Intake | null }) {
  const [state, action, pending] = useActionState<IntakeFormState, FormData>(saveIntakeAction, null);
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="roundName" className="block font-semibold mb-1">Round</label>
        <p className="text-sm text-base-content/70 mb-1">Saved into &ldquo;Date of Submission&rdquo; for each application, e.g. March 27.</p>
        <input id="roundName" name="roundName" defaultValue={intake?.roundName ?? ""} className="input input-bordered w-full max-w-xs" required />
      </div>
      <div>
        <label htmlFor="closesOn" className="block font-semibold mb-1">Applications close</label>
        <p className="text-sm text-base-content/70 mb-1">The form stops accepting applications at the end of this day.</p>
        <input id="closesOn" name="closesOn" type="date" defaultValue={intake?.closesOn ?? ""} className="input input-bordered" required />
      </div>
      <div>
        <label htmlFor="viewing" className="block font-semibold mb-1">Viewing and voting</label>
        <p className="text-sm text-base-content/70 mb-1">Shown at the top of the form.</p>
        <input id="viewing" name="viewing" defaultValue={intake?.viewing ?? ""} className="input input-bordered w-full"
          placeholder="e.g. Monday 1 February 2027 in the Ballroom at Stamford Arts Centre, PE9 2DL" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" name="open" defaultChecked={intake?.open ?? true} className="checkbox checkbox-sm" />
        <span>Accepting applications (untick to close early)</span>
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        <p aria-live="polite" className={`text-sm ${state?.ok ? "text-success" : "text-error"}`}>{state?.message}</p>
      </div>
    </form>
  );
}
