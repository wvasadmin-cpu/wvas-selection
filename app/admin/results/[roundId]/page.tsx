import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import ClearBallotButton from "@/components/clear-ballot-button";
import PrintButton from "@/components/print-button";
import { getAdminEmail } from "@/lib/admin";
import { getCommittee, getRound, listBallots } from "@/lib/store";
import { summariseRound, type Responder } from "@/lib/tally";

export const dynamic = "force-dynamic";

function when(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function ResponseGroup({
  title,
  people,
  roundId,
  canClear,
  tone,
}: {
  title: string;
  people: Responder[];
  roundId: string;
  canClear: boolean;
  tone: string;
}) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 break-inside-avoid print:bg-white">
      <h4 className={`font-semibold mb-2 ${tone}`}>
        {title} <span className="tabular-nums">({people.length})</span>
      </h4>
      {people.length === 0 ? (
        <p className="text-sm text-base-content/60">None</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {people.map((p) => (
            <li key={p.memberId} className="flex flex-wrap items-baseline gap-x-2">
              <span>{p.name}</span>
              {p.updatedAt && <span className="text-xs text-base-content/60">{when(p.updatedAt)}</span>}
              {canClear && <ClearBallotButton roundId={roundId} memberId={p.memberId} name={p.name} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function ResultsPage({ params }: { params: Promise<{ roundId: string }> }) {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;

  const { roundId } = await params;
  const [round, ballots, members] = await Promise.all([getRound(roundId), listBallots(roundId), getCommittee()]);
  if (!round) notFound();

  const results = summariseRound(round.applicants, ballots, members);
  const { complete, started, attending, notYet } = results.responses;
  const remote = ballots
    .filter((b) => !b.attending)
    .map((b) => ({ ballot: b, name: members.find((m) => m.id === b.memberId)?.name ?? "Former committee member" }))
    .sort((a, b) => a.name.localeCompare(b.name, "en-GB"));
  const printedAt = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/London" });

  return (
    <section>
      <div className="print:hidden">
        <AdminNav email={email} />
        <p className="text-sm mb-2">
          <Link href={`/admin/rounds/${encodeURIComponent(round.name)}`} className="link link-hover">
            ← {round.name}: preview and publish
          </Link>
        </p>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl">Results: {round.name}</h2>
          <p className="text-base-content/70">
            {round.applicants.length} applicants · voting {round.status === "open" ? "open" : "closed"}
            <span className="hidden print:inline"> · printed {printedAt}</span>
          </p>
        </div>
        <PrintButton />
      </header>

      <h3 className="font-display text-xl mb-3">Responses</h3>
      <p className="mb-3 text-sm text-base-content/80 print:hidden">
        A decision waits until everyone not attending has voted, so &ldquo;Not started&rdquo; and &ldquo;Part-way&rdquo;
        are the people to chase. Times are each person&apos;s last answer.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <ResponseGroup title="Voted online" people={complete} roundId={round.id} canClear tone="text-success" />
        <ResponseGroup title="Attending meeting" people={attending} roundId={round.id} canClear tone="" />
        <ResponseGroup title="Part-way" people={started} roundId={round.id} canClear tone="text-warning-content" />
        <ResponseGroup title="Not started" people={notYet} roundId={round.id} canClear={false} tone="text-error" />
      </div>

      <div className="space-y-12">
        {round.applicants.map((applicant) => {
          const summary = results.applicants.find((s) => s.applicantId === applicant.id);
          if (!summary) return null;
          return (
            <article key={applicant.id} className="card bg-base-100 border border-base-300 print:break-before-page print:border-0 print:bg-white">
              <div className="card-body print:p-0">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl">
                    Applicant {applicant.initials}{" "}
                    <span className="text-base font-sans text-base-content/70">{applicant.fullName}</span>
                  </h3>
                  <p className="text-lg">
                    {summary.yesPercent === null ? (
                      <span className="text-base-content/60">No votes yet</span>
                    ) : (
                      <>
                        <strong className="tabular-nums">{summary.yesPercent}%</strong> Yes overall
                      </>
                    )}
                  </p>
                </header>
                {summary.yesPercent !== null && (
                  <progress
                    className="progress progress-success w-full"
                    value={summary.yesPercent}
                    max={100}
                    aria-label={`${summary.yesPercent}% Yes`}
                  />
                )}

                <ul className="grid gap-4 grid-cols-3 md:grid-cols-6 mt-3">
                  {applicant.artworks.map((art) => {
                    const t = summary.artworks.find((a) => a.artworkId === art.id);
                    return (
                      <li key={art.id} className="break-inside-avoid">
                        <div className="aspect-square bg-base-200 rounded overflow-hidden flex items-center justify-center">
                          {art.hasImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/images/${round.id}/${art.id}`}
                              alt={art.title}
                              loading="lazy"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-base-content/60">No photo</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold leading-tight">
                          {art.slot}. {art.title}
                        </p>
                        <p className="text-sm tabular-nums">
                          <span className="text-success font-semibold">{t?.yes ?? 0} Yes</span>
                          {" · "}
                          <span className="text-error font-semibold">{t?.no ?? 0} No</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <h4 className="font-semibold mt-5">Feedback</h4>
                {summary.feedback.length === 0 ? (
                  <p className="text-sm text-base-content/60">None yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.feedback.map((f, i) => (
                      <li key={i} className="text-sm break-inside-avoid">
                        <span className="font-semibold">{f.memberName}</span>
                        {f.attending && <span className="text-base-content/60"> (attending)</span>}:{" "}
                        <span className="whitespace-pre-line">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {remote.length > 0 && (
                  <details className="mt-4" open>
                    <summary className="cursor-pointer font-semibold print:list-none">Individual votes</summary>
                    <div className="overflow-x-auto mt-2">
                      <table className="table table-xs">
                        <thead>
                          <tr>
                            <th>Member</th>
                            {applicant.artworks.map((art) => (
                              <th key={art.id} className="text-center">
                                {art.slot}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {remote.map(({ ballot, name }) => (
                            <tr key={ballot.memberId}>
                              <td>{name}</td>
                              {applicant.artworks.map((art) => {
                                const v = ballot.votes[art.id];
                                return (
                                  <td
                                    key={art.id}
                                    className={`text-center ${v === "yes" ? "text-success" : v === "no" ? "text-error" : "text-base-content/40"}`}
                                  >
                                    {v === "yes" ? "Yes" : v === "no" ? "No" : "–"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
