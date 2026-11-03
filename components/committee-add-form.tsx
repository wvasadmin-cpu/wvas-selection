"use client";

import { useActionState } from "react";
import { addMembersAction, type CommitteeFormState } from "@/actions/committee";

export default function CommitteeAddForm() {
  const [state, formAction, pending] = useActionState<CommitteeFormState, FormData>(addMembersAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="names" className="block font-semibold">
        Add names
      </label>
      <p id="names-help" className="text-sm text-base-content/70">
        One name per line. You can also paste rows straight from a spreadsheet (ID, first name, surname).
      </p>
      <textarea
        id="names"
        name="names"
        rows={5}
        aria-describedby="names-help"
        className="textarea textarea-bordered w-full"
        placeholder={"Firstname Surname\nFirstname Surname"}
      />
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add to list"}
        </button>
        <p aria-live="polite" className={`text-sm ${state?.ok ? "text-success" : "text-error"}`}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}
