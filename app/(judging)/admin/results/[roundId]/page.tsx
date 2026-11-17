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
  tone,
}: {
  title: string;
  people: (Responder & { status?: string })[];
  roundId: string;
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
          {people.map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex flex-wrap items-baseline gap-x-2">
              <span>{p.name}</span>
              {p.status && <span className="text-xs text-base-content/70">({p.status})</span>}
              {p.ballotIds.length > 1 && (
                <span
                  className="text-xs font-semibold text-warning-content bg-warning/30 px-1 rounded"
                  title="This name was entered on more than one device. Usually that's someone switching device, but check it was really them."
                >
                  {p.ballotIds.length} devices
                </span>
              )}
              {p.updatedAt && <span className="text-xs text-base-content/60">{when(p.updatedAt)}</span>}
              {p.ballotIds.length > 0 && <ClearBallotButton roundId={roundId} ballotIds={p.ballotIds} name={p.name} />}
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
  const { complete, started, attending, notYet, unlisted } = results.responses;
  const remote = results.voters
    .filter((v) => v.attending !== true && Object.keys(v.votes).length > 0)
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
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link href={`/admin/slips/${round.id}`} className="btn">
            Paper voting slips
          </Link>
          <PrintButton />
        </div>
      </header>

      <h3 className="font-display text-xl mb-3">Responses</h3>
      <p className="mb-3 text-sm text-base-content/80 print:hidden">
        A decision waits until everyone not attending has voted, so &ldquo;Not started&rdquo; and &ldquo;Part-way&rdquo;
        are the people to chase. Names are matched to the committee list as typed; anything that didn&apos;t match is shown
        separately. A &ldquo;2 devices&rdquo; flag means a name was entered on more than one device (usually someone switching
        device; their answers are combined, latest first). Times are each person&apos;s last answer; &ldquo;clear&rdquo;
        removes their votes (e.g. a test run).
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <ResponseGroup title="Voted online" people={complete} roundId={round.id} tone="text-success" />
        <ResponseGroup title="Attending meeting" people={attending} roundId={round.id} tone="" />
        <ResponseGroup title="Part-way" people={started} roundId={round.id} tone="text-warning-content" />
        <ResponseGroup title="Not started" people={notYet} roundId={round.id} tone="text-error" />
      </div>
      {unlisted.length > 0 && (
        <div className="-mt-6 mb-10">
          <ResponseGroup title="Not on the committee list (name typed differently?)" people={unlisted} roundId={round.id} tone="" />
        </div>
      )}

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
                        <span className="font-semibold">{f.voterName}</span>
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
                          {remote.map((voter) => (
                            <tr key={voter.ballotIds.join(",")}>
                              <td>{voter.name}</td>
                              {applicant.artworks.map((art) => {
                                const v = voter.votes[art.id];
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
