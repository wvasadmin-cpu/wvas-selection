"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { castVoteAction, saveFeedbackAction } from "@/actions/vote";
import ArtworkGallery from "@/components/artwork-gallery";
import type { Applicant, Vote } from "@/lib/types";
import { whatsMissing } from "@/lib/vote-flow";

/** What voters may see of an applicant: never the full name. */
export type PublicApplicant = Omit<Applicant, "fullName">;

type Props = {
  roundId: string;
  applicant: PublicApplicant;
  /** Attendees can look and comment, but don't vote. */
  attending: boolean;
  initialVotes: Record<string, Vote>;
  initialFeedback: string;
  backHref: string | null;
  nextHref: string;
  nextLabel: string;
};

export default function ApplicantVoting({
  roundId,
  applicant,
  attending,
  initialVotes,
  initialFeedback,
  backHref,
  nextHref,
  nextLabel,
}: Props) {
  const router = useRouter();
  const [votes, setVotes] = useState(initialVotes);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback);
  const [error, setError] = useState("");
  const [moving, setMoving] = useState(false);
  const [triedNext, setTriedNext] = useState(false);
  // Saves run one after another so quick clicks can't overwrite each other.
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const enqueue = <T,>(task: () => Promise<T>) => {
    const run = queue.current.then(task, task);
    queue.current = run.catch(() => undefined);
    return run;
  };

  const vote = (artworkId: string, value: Vote) => {
    setVotes((v) => ({ ...v, [artworkId]: value }));
    enqueue(() => castVoteAction(roundId, artworkId, value)).then((res) => {
      if (!res.ok) setError(res.message ?? "Your vote wasn't saved. Please try again.");
      else setError("");
    });
  };

  const saveFeedback = async () => {
    if (feedback.trim() === savedFeedback.trim()) return true;
    const text = feedback;
    const res = await enqueue(() => saveFeedbackAction(roundId, applicant.id, text));
    if (!res.ok) {
      setError(res.message ?? "Your feedback wasn't saved. Please try again.");
      return false;
    }
    setSavedFeedback(text);
    setError("");
    return true;
  };

  const missing = attending
    ? []
    : whatsMissing(
        { ...applicant, fullName: "" },
        { memberId: "", attending: false, votes, feedback: { [applicant.id]: feedback }, updatedAt: "" },
      );

  const go = async (href: string, requireComplete: boolean) => {
    if (requireComplete && missing.length > 0) {
      setTriedNext(true);
      return;
    }
    setMoving(true);
    const ok = await saveFeedback();
    await queue.current;
    if (ok) router.push(href);
    else setMoving(false);
  };

  return (
    <article className="space-y-5">
      <header>
        <h2 className="font-display text-3xl">Applicant {applicant.initials}</h2>
      </header>

      {applicant.qualifications && <p className="whitespace-pre-line font-semibold">{applicant.qualifications}</p>}
      {applicant.otherMembership && <p className="whitespace-pre-line">Member of: {applicant.otherMembership}</p>}
      {applicant.bio && <p className="whitespace-pre-line leading-relaxed">{applicant.bio}</p>}

      <p className="text-sm text-base-content/70">Tap a photo to see it full screen.</p>

      <ArtworkGallery
        items={applicant.artworks.map((art) => ({
          id: art.id,
          src: art.hasImage ? `/api/images/${roundId}/${art.id}` : null,
          title: `${art.slot}. ${art.title}`,
          medium: art.medium,
          caption: (
            <>
              <p className="font-semibold text-sm">
                {art.slot}. {art.title}
              </p>
              {art.medium && <p className="text-sm text-base-content/80">{art.medium}</p>}
              {!attending && art.hasImage && (
                <div role="group" aria-label={`Your vote for ${art.title}`} className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={votes[art.id] === "yes"}
                    onClick={() => vote(art.id, "yes")}
                    className={`btn btn-sm ${votes[art.id] === "yes" ? "btn-success" : "btn-outline"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    aria-pressed={votes[art.id] === "no"}
                    onClick={() => vote(art.id, "no")}
                    className={`btn btn-sm ${votes[art.id] === "no" ? "btn-error" : "btn-outline"}`}
                  >
                    No
                  </button>
                </div>
              )}
            </>
          ),
        }))}
      />

      <div>
        <label htmlFor="feedback" className="block font-semibold mb-1">
          {attending ? "Any early comments? (optional)" : "Your feedback on this applicant"}
        </label>
        {!attending && (
          <p id="feedback-help" className="text-sm text-base-content/70 mb-1">
            Positive and negative points. This is needed before moving on.
          </p>
        )}
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onBlur={saveFeedback}
          rows={5}
          maxLength={2000}
          aria-describedby={attending ? undefined : "feedback-help"}
          className="textarea textarea-bordered w-full"
        />
      </div>

      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {triedNext && missing.length > 0 && (
        <p role="alert" className="text-error">
          Before moving on, please add {missing.join(" and ")}.
        </p>
      )}

      <nav className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {backHref ? (
          <button type="button" className="btn" disabled={moving} onClick={() => go(backHref, false)}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" disabled={moving} onClick={() => go(nextHref, true)}>
          {moving ? "Saving…" : nextLabel}
        </button>
      </nav>
      <p className="text-xs text-base-content/60">
        Votes save as soon as you tap them. <Link href={`/vote/${roundId}?view=summary`} className="link">See all your answers</Link>
      </p>
    </article>
  );
}
