import Link from "next/link";
import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import { getAdminEmail } from "@/lib/admin";
import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { countRounds, type RoundCount } from "@/lib/applicants";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn error={(await searchParams).error} />;

  let rounds: RoundCount[] = [];
  let error = "";
  try {
    rounds = countRounds(await fetchApplicationRecords());
  } catch (e) {
    error = e instanceof AirtableError ? e.message : "Something went wrong reaching Airtable.";
    if (!(e instanceof AirtableError)) console.error(e);
  }

  return (
    <section>
      <AdminNav email={email} />
      <h2 className="font-display text-3xl mb-2">Judging rounds</h2>
      <p className="mb-6 text-base-content/80">
        Rounds come from the Date of Submission field in Airtable. Open one to preview it as judges will see it.
      </p>

      {error ? (
        <div role="alert" className="alert alert-error">{error}</div>
      ) : rounds.length === 0 ? (
        <p className="text-base-content/70">No applications found in Airtable.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rounds.map((r) => (
            <li key={r.round}>
              <Link
                href={`/admin/rounds/${encodeURIComponent(r.round)}`}
                className="card bg-base-100 border border-base-300 hover:border-primary transition-colors"
              >
                <div className="card-body p-5">
                  <h3 className="card-title font-display">{r.round}</h3>
                  <p className="text-sm text-base-content/80">
                    {r.applicants} {r.applicants === 1 ? "applicant" : "applicants"} · {r.photos} of {r.artworks} photos
                    {r.incomplete > 0 && <span className="text-warning-content"> · {r.incomplete} incomplete</span>}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
