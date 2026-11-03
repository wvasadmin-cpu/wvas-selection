import Link from "next/link";
import { notFound } from "next/navigation";
import { forgetMemberAction, setAttendingAction } from "@/actions/vote";
import ApplicantVoting, { type PublicApplicant } from "@/components/vote/applicant-voting";
import Guidelines from "@/components/vote/guidelines";
import NamePicker from "@/components/vote/name-picker";
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

function VotingAs({ roundId, name }: { roundId: string; name: string }) {
  return (
    <form action={forgetMemberAction} className="flex flex-wrap items-center gap-2 text-sm mb-6 pb-3 border-b border-base-300">
      <input type="hidden" name="roundId" value={roundId} />
      <span>
        Voting as <strong>{name}</strong>
      </span>
      <button type="submit" className="link link-hover text-base-content/70">
        Not you?
      </button>
    </form>
  );
}

function AttendingButtons({ roundId, current }: { roundId: string; current?: boolean }) {
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
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-box bg-base-100 border border-base-300">
              <span>
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
  const { round, access, members, member, ballot } = ctx;

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
        <PasscodeForm roundId={round.id} />
      </section>
    );
  }

  // 2. Who are you?
  if (!member) {
    return (
      <section className="max-w-2xl space-y-6">
        <Heading name={round.name} count={round.applicants.length} />
        <p>
          Welcome. Committee members not attending the meeting are asked to view each applicant&apos;s work and vote
          here. Please start by choosing your name.
        </p>
        <NamePicker roundId={round.id} members={members} />
      </section>
    );
  }

  // 3. Attending the meeting?
  if (!ballot) {
    return (
      <section className="max-w-2xl space-y-6">
        <VotingAs roundId={round.id} name={member.name} />
        <Heading name={round.name} count={round.applicants.length} />
        <Guidelines />
        <div className="space-y-3">
          <p className="font-semibold text-lg">Are you attending the committee meeting?</p>
          <p className="text-base-content/80">
            If you are, you&apos;ll vote there and nothing more is needed now. If not, you&apos;ll vote Yes or No on each
            artwork and leave feedback for each applicant.
          </p>
          <AttendingButtons roundId={round.id} />
        </div>
      </section>
    );
  }

  const applicants = round.applicants;
  const requested = Number(query.applicant);
  const showSummary =
    query.view === "summary" ||
    applicants.length === 0 ||
    (!requested && (ballot.attending || firstIncomplete(applicants, ballot) === -1));

  if (showSummary) {
    return (
      <section className="max-w-3xl">
        <VotingAs roundId={round.id} name={member.name} />
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
      <VotingAs roundId={round.id} name={member.name} />
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>
            {round.name} · Applicant {index + 1} of {total}
          </span>
          {!ballot.attending && (
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
        attending={ballot.attending}
        initialVotes={ballot.votes}
        initialFeedback={ballot.feedback[applicant.id] ?? ""}
        backHref={index > 0 ? `/vote/${round.id}?applicant=${index}` : null}
        nextHref={isLast ? `/vote/${round.id}?view=summary` : `/vote/${round.id}?applicant=${index + 2}`}
        nextLabel={isLast ? "Finish" : "Next applicant →"}
      />
    </section>
  );
}
