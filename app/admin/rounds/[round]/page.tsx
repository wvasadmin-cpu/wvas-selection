import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import { getAdminEmail } from "@/lib/admin";
import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { applicantsForRound, isIncomplete, type ApplicantWithImages } from "@/lib/applicants";

export const dynamic = "force-dynamic";

export default async function RoundPreviewPage({ params }: { params: Promise<{ round: string }> }) {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;

  const round = decodeURIComponent((await params).round);
  let entries: ApplicantWithImages[] = [];
  let error = "";
  try {
    entries = applicantsForRound(await fetchApplicationRecords(), round);
  } catch (e) {
    error = e instanceof AirtableError ? e.message : "Something went wrong reaching Airtable.";
    if (!(e instanceof AirtableError)) console.error(e);
  }

  const ready = entries.filter((e) => !isIncomplete(e.applicant));
  const incomplete = entries.filter((e) => isIncomplete(e.applicant));

  return (
    <section>
      <AdminNav email={email} />
      <p className="text-sm mb-2">
        <Link href="/admin" className="link link-hover">← All rounds</Link>
      </p>
      <h2 className="font-display text-3xl mb-2">Preview: {round}</h2>
      <p className="mb-6 text-base-content/80">
        This is what judges will see, except full names and the notes in gold, which only you see. Corrections and
        publishing come next.
      </p>

      {error && <div role="alert" className="alert alert-error mb-6">{error}</div>}

      {incomplete.length > 0 && (
        <div role="status" className="alert alert-warning mb-8">
          Left out as incomplete (no artworks yet): {incomplete.map((e) => e.applicant.fullName || "unnamed").join(", ")}.
        </div>
      )}

      <div className="space-y-12">
        {ready.map(({ applicant }) => {
          const missing = applicant.artworks.filter((a) => !a.hasImage).length;
          return (
            <article key={applicant.id} className="card bg-base-100 border border-base-300">
              <div className="card-body">
                <header className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="font-display text-2xl">Applicant {applicant.initials}</h3>
                  <span className="text-sm bg-secondary/30 px-2 rounded">{applicant.fullName}</span>
                  {missing > 0 && (
                    <span className="text-sm bg-secondary/30 px-2 rounded">
                      {missing} {missing === 1 ? "photo" : "photos"} missing
                    </span>
                  )}
                </header>

                {applicant.qualifications && (
                  <p className="whitespace-pre-line font-semibold text-sm">{applicant.qualifications}</p>
                )}
                {applicant.otherMembership && (
                  <p className="whitespace-pre-line text-sm">Member of: {applicant.otherMembership}</p>
                )}
                {applicant.bio && <p className="whitespace-pre-line text-sm leading-relaxed">{applicant.bio}</p>}

                <ul className="grid gap-5 grid-cols-2 md:grid-cols-3 mt-4">
                  {applicant.artworks.map((art) => {
                    const image = entries.find((e) => e.applicant.id === applicant.id)?.images.find((i) => i.artworkId === art.id);
                    return (
                      <li key={art.id}>
                        <div className="aspect-square bg-base-200 rounded overflow-hidden flex items-center justify-center">
                          {image ? (
                            // Airtable's own (expiring) link: fine for the admin preview only.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image.url} alt={art.title} loading="lazy" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-sm text-base-content/60">Image to follow</span>
                          )}
                        </div>
                        <p className="mt-2 font-semibold text-sm">
                          {art.slot}. {art.title}
                        </p>
                        <p className="text-sm text-base-content/80">
                          {art.medium || <span className="italic">Medium not given</span>}
                          {art.mediumGuessed && art.medium && (
                            <span className="ml-1 text-xs bg-secondary/30 px-1 rounded">guessed</span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
