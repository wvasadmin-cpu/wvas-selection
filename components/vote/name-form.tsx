"use client";

import { useActionState } from "react";
import { enterNameAction, type VoteFormState } from "@/actions/vote";

export default function NameForm({ roundId }: { roundId: string }) {
  const [state, action, pending] = useActionState<VoteFormState, FormData>(enterNameAction, null);
  return (
    <form action={action} className="space-y-3 max-w-md">
      <input type="hidden" name="roundId" value={roundId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="first" className="block font-semibold mb-1">
            First name
          </label>
          <input id="first" name="first" autoComplete="given-name" className="input input-bordered w-full" required />
        </div>
        <div>
          <label htmlFor="surname" className="block font-semibold mb-1">
            Surname
          </label>
          <input id="surname" name="surname" autoComplete="family-name" className="input input-bordered w-full" required />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "One moment…" : "Continue"}
      </button>
      {state && !state.ok && state.message && (
        <p role="alert" className="text-error text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
