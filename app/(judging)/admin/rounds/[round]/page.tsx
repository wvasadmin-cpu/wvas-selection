import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import ApplicantEditor from "@/components/applicant-editor";
import ArtworkGallery from "@/components/artwork-gallery";
import PublishPanel from "@/components/publish-panel";
import { getAdminEmail } from "@/lib/admin";
import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { applicantsForRound, isIncomplete, type ApplicantWithImages } from "@/lib/applicants";
import { applyCorrection, isExcluded, type RoundCorrections } from "@/lib/corrections";
import type { RoundSummary } from "@/lib/rounds";
import { findPublishedRound, getCorrections } from "@/lib/store";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.AUTH_URL ?? "https://wvas-selection.netlify.app").replace(/\/$/, "");
}

export default async function RoundPreviewPage({ params }: { params: Promise<{ round: string }> }) {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;

  const round = decodeURIComponent((await params).round);
  let entries: ApplicantWithImages[] = [];
  let corrections: RoundCorrections = {};
  let published: RoundSummary | null = null;
  let error = "";
  try {
    [entries, corrections, published] = await Promise.all([
      fetchApplicationRecords().then((records) => applicantsForRound(records, round)),
      getCorrections(round),
      findPublishedRound(round),
    ]);
  } catch (e) {
    error = e instanceof AirtableError ? e.message : "Something went wrong loading this round.";
    if (!(e instanceof AirtableError)) console.error(e);
  }

  const incomplete = entries.filter((e) => isIncomplete(e.applicant));
  const complete = entries.filter((e) => !isIncomplete(e.applicant));
  const included = complete.filter((e) => !isExcluded(corrections[e.applicant.id]));
  const excluded = complete.filter((e) => isExcluded(corrections[e.applicant.id]));

  return (
    <section>
      <AdminNav email={email} />
      <p className="text-sm mb-2">
        <Link href="/admin" className="link link-hover">
          ← All rounds
        </Link>
      </p>
      <h2 className="font-display text-3xl mb-2">{round}</h2>
      <p className="mb-6 text-base-content/80">
        Each applicant appears below as judges will see them. Notes in gold are for you only. Use{" "}
        <strong>Correct details</strong> to tidy anything before publishing.
      </p>

      {error && (
        <div role="alert" className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {!error && (
        <PublishPanel
          roundName={round}
          published={published}
          voteUrl={published ? `${siteUrl()}/vote/${published.id}` : ""}
        />
      )}

      {incomplete.length > 0 && (
        <div role="status" className="alert alert-warning mb-8">
          Left out as incomplete (no artworks yet): {incomplete.map((e) => e.applicant.fullName || "unnamed").join(", ")}.
        </div>
      )}

      <div className="space-y-12">
        {included.map(({ applicant: base, images }) => {
          const correction = corrections[base.id];
          const applicant = applyCorrection(base, correction);
          const missing = applicant.artworks.filter((a) => !a.hasImage).length;
          return (
            <article key={applicant.id} className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-2xl">Applicant {applicant.initials}</h3>
                  <span className="text-sm bg-secondary/30 px-2 rounded">{applicant.fullName}</span>
                  {missing > 0 && (
                    <span className="text-sm bg-secondary/30 px-2 rounded">
                      {missing} {missing === 1 ? "photo" : "photos"} missing
                    </span>
                  )}
                  {correction && <span className="text-sm bg-secondary/30 px-2 rounded">corrected</span>}
                </header>

                {applicant.qualifications && (
                  <p className="whitespace-pre-line font-semibold text-sm">{applicant.qualifications}</p>
                )}
                {applicant.otherMembership && (
                  <p className="whitespace-pre-line text-sm">Member of: {applicant.otherMembership}</p>
                )}
                {applicant.bio && <p className="whitespace-pre-line text-sm leading-relaxed">{applicant.bio}</p>}

                <div className="mt-4">
                  <ArtworkGallery
                    items={applicant.artworks.map((art) => ({
                      id: art.id,
                      // Airtable's own (expiring) link: fine for the admin preview only.
                      src: images.find((i) => i.artworkId === art.id)?.url ?? null,
                      title: `${art.slot}. ${art.title}`,
                      medium: art.medium,
                      caption: (
                        <>
                          <p className="font-semibold text-sm">
                            {art.slot}. {art.title}
                          </p>
                          <p className="text-sm text-base-content/80">
                            {art.medium || <span className="italic">Medium not given</span>}
                            {art.mediumGuessed && art.medium && (
                              <span className="ml-1 text-xs bg-secondary/30 px-1 rounded">guessed</span>
                            )}
                          </p>
                        </>
                      ),
                    }))}
                  />
                </div>

                <ApplicantEditor roundName={round} applicant={applicant} excluded={false} />
              </div>
            </article>
          );
        })}
      </div>

      {excluded.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-xl mb-3">Left out of this round</h3>
          <div className="space-y-4">
            {excluded.map(({ applicant: base }) => {
              const applicant = applyCorrection(base, corrections[base.id]);
              return (
                <div key={applicant.id} className="card bg-base-100 border border-dashed border-base-300">
                  <div className="card-body py-4">
                    <p>
                      <strong>Applicant {applicant.initials}</strong>{" "}
                      <span className="text-sm bg-secondary/30 px-2 rounded">{applicant.fullName}</span>
                    </p>
                    <p className="text-sm text-base-content/70">Untick the box below and save to include them again.</p>
                    <ApplicantEditor roundName={round} applicant={applicant} excluded />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
