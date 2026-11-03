"use client";

import { unlockNameAction } from "@/actions/results";

export default function UnlockNameButton({ roundId, memberId, name }: { roundId: string; memberId: string; name: string }) {
  return (
    <form
      action={unlockNameAction}
      className="inline print:hidden"
      onSubmit={(e) => {
        if (!confirm(`Unlock ${name}'s name so they can carry on from a different device? Their votes are kept.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="memberId" value={memberId} />
      <button type="submit" className="link link-hover text-xs">
        unlock
      </button>
    </form>
  );
}
