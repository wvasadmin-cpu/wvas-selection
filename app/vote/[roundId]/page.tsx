import Link from "next/link";
import { notFound } from "next/navigation";
import { setAttendingAction, startOverAction } from "@/actions/vote";
import ApplicantVoting, { type PublicApplicant } from "@/components/vote/applicant-voting";
import Guidelines from "@/components/vote/guidelines";
import NameForm from "@/components/vote/name-form";
import PasscodeForm from "@/components/vote/passcode-form";
import type { Applicant, Ballot } from "@/lib/types";
import { firstIncomplete, progressOf, whatsMissing } from "@/lib/vote-flow";
import { getVoterContext } from "@/lib/voter";

export const dynamic = "force-dynamic";

/** Strip the full name: voters only ever see initials. */
function toPublic(a: Applicant): PublicApplicant {
  return {
    id: a.id,
    initials: a.initials,
    bio: a.bio,
    qualifications: a.qualifications,
    otherMembership: a.otherMembership,
    artworks: a.artworks,
  };
}

function Heading({ name, count }: { name: string; count: number }) {
  return (
    <div className="mb-6">
      <p className="text-sm uppercase tracking-widest text-base-content/60">Exhibitor applications</p>
      <h2 className="font-display text-3xl">{name}</h2>
      <p className="text-base-content/70">
        {count} {count === 1 ? "applicant" : "applicants"}
      </p>
    </div>
  );
}

function ViewingTip() {
  return (
    <p className="rounded-box border border-info/40 bg-info/10 p-3 text-sm">
      For the best view of the artwork, we recommend using a computer or tablet rather than a phone.
    </p>
  );
}

function VotingAs({ roundId, name }: { roundId: string; name: string }) {
  return (
    <form
      action={startOverAction}
      className="flex flex-wrap items-center gap-2 text-sm mb-6 pb-3 border-b border-base-300"
    >
      <input type="hidden" name="roundId" value={roundId} />
      <span>
        Voting as <strong>{name}</strong>
      </span>
      <button type="submit" className="link link-hover text-base-content/70">
        Not you? Start as someone else
      </button>
    </form>
  );
}

function AttendingButtons({ roundId, current }: { roundId: string; current?: boolean | null }) {
  return (
    <form action={setAttendingAction} className="flex flex-wrap gap-3">
      <input type="hidden" name="roundId" value={roundId} />
      <button type="submit" name="attending" value="yes" className={`btn ${current === true ? "btn-primary" : ""}`}>
        Yes, I&apos;m attending the meeting
      </button>
      <button type="submit" name="attending" value="no" className={`btn ${current === false ? "btn-primary" : ""}`}>
        No, I&apos;ll vote online
      </button>
    </form>
  );
}

function Thumbs({ roundId, applicant }: { roundId: string; applicant: Applicant }) {
  return (
    <span className="flex gap-2 flex-1">
      {applicant.artworks
        .filter((art) => art.hasImage)
        .slice(0, 4)
        .map((art) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={art.id}
            src={`/api/images/${roundId}/${art.id}`}
            alt=""
            loading="lazy"
            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded bg-base-200"
          />
        ))}
    </span>
  );
}

/** The applicants as a teaser on the first screen: viewing opens once the attending question is answered. */
function ApplicantPreviews({ roundId, applicants }: { roundId: string; applicants: Applicant[] }) {
  return (
    <ul className="space-y-3">
      {applicants.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-4 p-3 rounded-box bg-base-100 border border-base-300">
          <strong className="min-w-28">Applicant {a.initials}</strong>
          <Thumbs roundId={roundId} applicant={a} />
          <span className="btn btn-sm btn-disabled" aria-disabled="true">
            View
          </span>
        </li>
      ))}
    </ul>
  );
}

function Summary({ roundId, applicants, ballot }: { roundId: string; applicants: Applicant[]; ballot: Ballot }) {
  const { done, total } = progressOf(applicants, ballot);
  const allDone = done === total;
  return (
    <section className="space-y-6">
      {ballot.attending ? (
        <div role="status" className="alert alert-success">
          Thank you: you&apos;re recorded as attending the committee meeting, where you&apos;ll vote. You can still look
          through the applicants below and leave early comments if you wish.
        </div>
      ) : allDone ? (
        <div role="status" className="alert alert-success">
          Thank you: your votes and feedback are all in. You can change them until the round is closed.
        </div>
      ) : (
        <div role="status" className="alert alert-warning">
          {done} of {total} applicants done. Your answers so far are saved.
        </div>
      )}

      <ul className="space-y-2">
        {applicants.map((a, i) => {
          const missing = ballot.attending ? [] : whatsMissing(a, ballot);
          const yes = a.artworks.filter((art) => ballot.votes[art.id] === "yes").length;
          const no = a.artworks.filter((art) => ballot.votes[art.id] === "no").length;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-4 p-3 rounded-box bg-base-100 border border-base-300">
              <span className="min-w-28">
                <strong>Applicant {a.initials}</strong>{" "}
                <span className="text-sm text-base-content/70">
                  {ballot.attending
                    ? ballot.feedback[a.id]
                      ? "comment left"
                      : ""
                    : missing.length
                      ? `still needs ${missing.join(" and ")}`
                      : `${yes} yes, ${no} no, feedback given`}
                </span>
              </span>
              <Thumbs roundId={roundId} applicant={a} />
              <Link href={`/vote/${roundId}?applicant=${i + 1}`} className="btn btn-sm">
                {ballot.attending ? "View" : missing.length ? "Continue" : "Change"}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 border-t border-base-300 space-y-2">
        <p className="text-sm font-semibold">Change whether you&apos;re attending the meeting</p>
        <AttendingButtons roundId={roundId} current={ballot.attending} />
      </div>
    </section>
  );
}

export default async function VotePage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ applicant?: string; view?: string }>;
}) {
  const { roundId } = await params;
  const query = await searchParams;
  const ctx = await getVoterContext(roundId);
  if (!ctx) notFound();
  const { round, access, ballot } = ctx;

  if (round.status === "closed") {
    return (
      <section className="max-w-2xl">
        <Heading name={round.name} count={round.applicants.length} />
        <p>Voting for this round has closed. Thank you.</p>
      </section>
    );
  }

  // 1. Passcode, when one is set
  if (!access) {
    return (
      <section className="max-w-2xl">
        <Heading name={round.name} count={round.applicants.length} />
        <div className="mb-6">
          <ViewingTip />
        </div>
        <PasscodeForm roundId={round.id} />
      </section>
    );
  }

  // 2. Who are you?
  if (!ballot) {
    return (
      <section className="max-w-2xl space-y-6">
        <Heading name={round.name} count={round.applicants.length} />
        <p>
          Welcome. Committee members not attending the meeting are asked to view each applicant&apos;s work and vote
          here. Please start by entering your name.
        </p>
        <ViewingTip />
        <NameForm roundId={round.id} />
      </section>
    );
  }

  const applicants = round.applicants;
  const requested = Number(query.applicant);

  // 3. Attending the meeting? Asked before any applicant can be viewed, with
  // the applicants shown below as a teaser.
  if (ballot.attending === null) {
    return (
      <section className="max-w-2xl space-y-8">
        <div>
          <VotingAs roundId={round.id} name={ballot.name} />
          <Heading name={round.name} count={applicants.length} />
        </div>
        <div className="space-y-3">
          <p className="font-display text-2xl">Hi {ballot.name.split(" ")[0]},</p>
          <p className="font-semibold text-lg">Are you attending the committee meeting?</p>
          <p className="text-base-content/80">
            If you are, you&apos;ll vote there and nothing more is needed now. Artist submissions can still be viewed and
            comments made on the next page. If you are unable to attend, please vote Yes or No on each artwork and leave
            feedback for each applicant. Thank you.
          </p>
          <AttendingButtons roundId={round.id} />
          <p className="text-sm text-base-content/70">You can change your answer later.</p>
        </div>
        {applicants.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-base-300">
            <p className="font-semibold text-lg">Take a look at the applicants</p>
            <p className="text-base-content/80">
              Everyone is encouraged to view the artwork beforehand, whether or not you&apos;re attending. Please answer
              the question above first.
            </p>
            <ApplicantPreviews roundId={round.id} applicants={applicants} />
          </div>
        )}
      </section>
    );
  }

  const showSummary =
    query.view === "summary" ||
    applicants.length === 0 ||
    (!requested && (ballot.attending === true || firstIncomplete(applicants, ballot) === -1));

  if (showSummary) {
    return (
      <section className="max-w-3xl">
        <VotingAs roundId={round.id} name={ballot.name} />
        <Heading name={round.name} count={applicants.length} />
        <Summary roundId={round.id} applicants={applicants} ballot={ballot} />
      </section>
    );
  }

  // 4. One applicant per screen
  const index =
    requested >= 1 && requested <= applicants.length ? requested - 1 : Math.max(0, firstIncomplete(applicants, ballot));
  const applicant = applicants[index];
  const { done, total } = progressOf(applicants, ballot);
  const isLast = index === applicants.length - 1;

  return (
    <section className="max-w-4xl">
      <VotingAs roundId={round.id} name={ballot.name} />
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>
            {round.name} · Applicant {index + 1} of {total}
          </span>
          {ballot.attending === false && (
            <span className="text-base-content/70">
              {done} of {total} done
            </span>
          )}
        </div>
        <progress className="progress progress-primary w-full" value={index + 1} max={total} aria-label="Progress" />
      </div>
      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-semibold">Guidelines for selection</summary>
        <div className="mt-2">
          <Guidelines />
        </div>
      </details>
      <ApplicantVoting
        key={applicant.id}
        roundId={round.id}
        applicant={toPublic(applicant)}
        attending={ballot.attending === true}
        initialVotes={ballot.votes}
        initialFeedback={ballot.feedback[applicant.id] ?? ""}
        backHref={index > 0 ? `/vote/${round.id}?applicant=${index}` : `/vote/${round.id}?view=summary`}
        backLabel={index > 0 ? "← Back" : "← Back to start"}
        nextHref={isLast ? `/vote/${round.id}?view=summary` : `/vote/${round.id}?applicant=${index + 2}`}
        nextLabel={isLast ? "Finish" : "Next applicant →"}
      />
    </section>
  );
}
