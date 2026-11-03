"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  publishAction,
  refreshAction,
  setPasscodeAction,
  setStatusAction,
  type ActionState,
} from "@/actions/rounds";
import ActionMessage from "@/components/action-message";
import type { RoundSummary } from "@/lib/rounds";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
}

function NotPublished({ roundName }: { roundName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(publishAction, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="round" value={roundName} />
      <p>
        When everything below looks right, publish the round. This copies the photos and creates the voting link to send
        to the committee.
      </p>
      <div>
        <label htmlFor="passcode" className="block text-sm font-semibold">
          Passcode (optional)
        </label>
        <p id="passcode-help" className="text-sm text-base-content/70 mb-1">
          A word to put in your email alongside the link. Anyone the link is forwarded to can&apos;t get in without it.
        </p>
        <input
          id="passcode"
          name="passcode"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="passcode-help"
          className="input input-bordered w-full max-w-xs"
          placeholder="e.g. heron"
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Publishing… (copying photos)" : "Publish round"}
        </button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function Published({ round, voteUrl }: { round: RoundSummary; voteUrl: string }) {
  const [refreshState, refresh, refreshing] = useActionState<ActionState, FormData>(refreshAction, null);
  const [passState, savePasscode, savingPass] = useActionState<ActionState, FormData>(setPasscodeAction, null);
  const [copied, setCopied] = useState(false);
  const open = round.status === "open";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`badge ${open ? "badge-success" : "badge-neutral"}`}>{open ? "Open for voting" : "Closed"}</span>
        <span className="text-sm text-base-content/70">
          {round.applicantCount} applicants · published {formatDate(round.publishedAt)}
          {round.refreshedAt !== round.publishedAt && ` · refreshed ${formatDate(round.refreshedAt)}`}
        </span>
        <Link href={`/admin/results/${round.id}`} className="btn btn-sm btn-primary ml-auto">
          View results
        </Link>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Voting link for the committee</p>
        <div className="flex flex-wrap gap-2">
          <input readOnly value={voteUrl} aria-label="Voting link" className="input input-bordered input-sm flex-1 min-w-0 font-mono" />
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(voteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      <form action={savePasscode} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="roundId" value={round.id} />
        <div>
          <label htmlFor="passcode-edit" className="block text-sm font-semibold mb-1">
            Passcode
          </label>
          <input
            id="passcode-edit"
            name="passcode"
            defaultValue={round.passcode}
            autoComplete="off"
            spellCheck={false}
            placeholder="None"
            className="input input-bordered input-sm w-48"
          />
        </div>
        <button type="submit" className="btn btn-sm btn-ghost" disabled={savingPass}>
          Save passcode
        </button>
        <div className="basis-full">
          <ActionMessage state={passState} />
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <form action={refresh}>
          <input type="hidden" name="round" value={round.name} />
          <button type="submit" className="btn btn-sm" disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh from Airtable"}
          </button>
        </form>
        <form
          action={setStatusAction}
          onSubmit={(e) => {
            if (open && !confirm("Close this round? Committee members won't be able to vote or change votes.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="status" value={open ? "closed" : "open"} />
          <button type="submit" className="btn btn-sm btn-ghost">
            {open ? "Close round" : "Reopen round"}
          </button>
        </form>
        <ActionMessage state={refreshState} />
      </div>
      <p className="text-sm text-base-content/70">
        Refresh picks up late photos and changes made in Airtable or below. Votes already made are kept.
      </p>
    </div>
  );
}

export default function PublishPanel({
  roundName,
  published,
  voteUrl,
}: {
  roundName: string;
  published: RoundSummary | null;
  voteUrl: string;
}) {
  return (
    <div className="card bg-base-100 border-2 border-secondary mb-10">
      <div className="card-body">
        <h3 className="card-title font-display">Publish</h3>
        {published ? <Published round={published} voteUrl={voteUrl} /> : <NotPublished roundName={roundName} />}
      </div>
    </div>
  );
}
