"use client";

import { useActionState, useState } from "react";
import { chooseMemberAction, type VoteFormState } from "@/actions/vote";
import type { CommitteeMember } from "@/lib/committee";

export default function NamePicker({ roundId, members }: { roundId: string; members: CommitteeMember[] }) {
  const [state, action, pending] = useActionState<VoteFormState, FormData>(chooseMemberAction, null);
  const [memberId, setMemberId] = useState("");

  if (members.length === 0) {
    return <p>The committee list hasn&apos;t been set up yet. Please contact the Membership Secretary.</p>;
  }

  // Someone has already voted under this name: ask before carrying on.
  if (state?.confirmName) {
    return (
      <form action={action} className="space-y-4 max-w-md">
        <input type="hidden" name="roundId" value={roundId} />
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="confirmed" value="yes" />
        <div role="alert" className="alert alert-warning">
          {state.confirmName} has already started voting. Is this you?
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            Yes, I&apos;m {state.confirmName}
          </button>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            No, go back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-3 max-w-sm">
      <input type="hidden" name="roundId" value={roundId} />
      <label htmlFor="member" className="block font-semibold">
        Your name
      </label>
      <select
        id="member"
        name="memberId"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        className="select select-bordered w-full"
        required
      >
        <option value="" disabled>
          Choose your name…
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary" disabled={pending || !memberId}>
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
