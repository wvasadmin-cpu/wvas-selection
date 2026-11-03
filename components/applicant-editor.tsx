"use client";

import { useActionState } from "react";
import { saveCorrectionsAction, type ActionState } from "@/actions/rounds";
import ActionMessage from "@/components/action-message";
import type { Applicant } from "@/lib/types";

// "Correct details" form for one applicant. Values start as shown to judges
// (Airtable plus any earlier corrections); only real changes are stored.
export default function ApplicantEditor({
  roundName,
  applicant,
  excluded,
}: {
  roundName: string;
  applicant: Applicant;
  excluded: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCorrectionsAction, null);
  const field = (name: string) => `${applicant.id}-${name}`;

  return (
    <details className="collapse collapse-arrow bg-base-200 mt-4" open={excluded || undefined}>
      <summary className="collapse-title font-semibold">Correct details</summary>
      <div className="collapse-content">
        <form action={action} className="space-y-4">
          <input type="hidden" name="round" value={roundName} />
          <input type="hidden" name="applicantId" value={applicant.id} />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="excluded" defaultChecked={excluded} className="checkbox checkbox-sm" />
            <span>Leave this applicant out of the round</span>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor={field("qualifications")} className="block text-sm font-semibold mb-1">
                Qualifications
              </label>
              <textarea
                id={field("qualifications")}
                name="qualifications"
                defaultValue={applicant.qualifications}
                rows={3}
                className="textarea textarea-bordered w-full"
              />
            </div>
            <div>
              <label htmlFor={field("otherMembership")} className="block text-sm font-semibold mb-1">
                Other membership
              </label>
              <textarea
                id={field("otherMembership")}
                name="otherMembership"
                defaultValue={applicant.otherMembership}
                rows={3}
                className="textarea textarea-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor={field("bio")} className="block text-sm font-semibold mb-1">
              Bio
            </label>
            <p className="text-sm text-base-content/70 mb-1">You can trim anything that would identify the applicant.</p>
            <textarea
              id={field("bio")}
              name="bio"
              defaultValue={applicant.bio}
              rows={6}
              className="textarea textarea-bordered w-full"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold mb-1">Artworks</legend>
            {applicant.artworks.map((art) => (
              <div key={art.id} className="grid gap-2 sm:grid-cols-[2rem_1fr_1fr] items-center">
                <span className="text-sm text-base-content/70">{art.slot}.</span>
                <input
                  name={`title:${art.id}`}
                  defaultValue={art.title}
                  aria-label={`Artwork ${art.slot} title`}
                  placeholder="Title"
                  autoComplete="off"
                  className="input input-bordered input-sm w-full"
                />
                <input
                  name={`medium:${art.id}`}
                  defaultValue={art.medium}
                  aria-label={`Artwork ${art.slot} medium`}
                  placeholder="Medium"
                  autoComplete="off"
                  className="input input-bordered input-sm w-full"
                />
              </div>
            ))}
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? "Saving…" : "Save corrections"}
            </button>
            <ActionMessage state={state} />
          </div>
          <p className="text-xs text-base-content/60">
            Corrections are kept on this site only; Airtable isn&apos;t changed. Putting a field back to its Airtable
            wording removes the correction.
          </p>
        </form>
      </div>
    </details>
  );
}
