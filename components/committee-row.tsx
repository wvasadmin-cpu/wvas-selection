"use client";

import { useActionState } from "react";
import { removeMemberAction, renameMemberAction, type CommitteeFormState } from "@/actions/committee";
import type { CommitteeMember } from "@/lib/committee";

export default function CommitteeRow({ member }: { member: CommitteeMember }) {
  const [state, renameAction, pending] = useActionState<CommitteeFormState, FormData>(renameMemberAction, null);

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 border-b border-base-300">
      <form action={renameAction} className="flex flex-1 min-w-0 items-center gap-2">
        <input type="hidden" name="id" value={member.id} />
        <label className="sr-only" htmlFor={`name-${member.id}`}>
          Name
        </label>
        <input
          id={`name-${member.id}`}
          name="name"
          defaultValue={member.name}
          autoComplete="off"
          className="input input-bordered input-sm flex-1 min-w-0"
        />
        <button type="submit" className="btn btn-sm btn-ghost" disabled={pending}>
          Save
        </button>
      </form>
      <form
        action={removeMemberAction}
        onSubmit={(e) => {
          if (!confirm(`Remove ${member.name} from the committee list?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={member.id} />
        <button type="submit" className="btn btn-sm btn-ghost text-error">
          Remove
        </button>
      </form>
      {state?.message && (
        <p aria-live="polite" className={`basis-full text-sm ${state.ok ? "text-success" : "text-error"}`}>
          {state.message}
        </p>
      )}
    </li>
  );
}
