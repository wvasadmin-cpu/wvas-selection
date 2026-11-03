"use client";

import { useActionState } from "react";
import { enterPasscodeAction, type VoteFormState } from "@/actions/vote";

export default function PasscodeForm({ roundId }: { roundId: string }) {
  const [state, action, pending] = useActionState<VoteFormState, FormData>(enterPasscodeAction, null);
  return (
    <form action={action} className="space-y-3 max-w-sm">
      <input type="hidden" name="roundId" value={roundId} />
      <label htmlFor="passcode" className="block font-semibold">
        Passcode
      </label>
      <p id="passcode-help" className="text-sm text-base-content/70">
        You&apos;ll find it in the email that came with this link.
      </p>
      <input
        id="passcode"
        name="passcode"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby="passcode-help"
        className="input input-bordered w-full"
        required
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
      {state && !state.ok && (
        <p role="alert" className="text-error text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
