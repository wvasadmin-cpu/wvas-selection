"use client";

import { clearBallotAction } from "@/actions/results";

export default function ClearBallotButton({ roundId, memberId, name }: { roundId: string; memberId: string; name: string }) {
  return (
    <form
      action={clearBallotAction}
      className="inline print:hidden"
      onSubmit={(e) => {
        if (!confirm(`Clear all of ${name}'s votes and feedback for this round? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="memberId" value={memberId} />
      <button type="submit" className="link link-hover text-error text-xs">
        clear
      </button>
    </form>
  );
}
