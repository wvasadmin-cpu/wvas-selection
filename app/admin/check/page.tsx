import { AirtableError, fetchApplicationRecords } from "@/lib/airtable";
import { countRounds, type RoundCount } from "@/lib/applicants";

// Connection check: proves the site can read Airtable. Shows counts only, no
// names or details, so it is safe before admin sign-in is set up.
export const dynamic = "force-dynamic";

export default async function AirtableCheckPage() {
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
      <h2 className="font-display text-3xl mb-2">Airtable connection check</h2>
      <p className="text-base-content/70 mb-6">Counts only: no names or details are shown here.</p>

      {error ? (
        <div role="alert" className="alert alert-error">{error}</div>
      ) : (
        <>
          <div role="status" className="alert alert-success mb-6">Connected to Airtable.</div>
          <div className="overflow-x-auto">
            <table className="table bg-base-100">
              <thead>
                <tr>
                  <th>Round</th>
                  <th className="text-right">Applicants</th>
                  <th className="text-right">Incomplete</th>
                  <th className="text-right">Artworks</th>
                  <th className="text-right">Photos</th>
                  <th className="text-right">Media guessed</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.round}>
                    <td>{r.round}</td>
                    <td className="text-right tabular-nums">{r.applicants}</td>
                    <td className="text-right tabular-nums">{r.incomplete}</td>
                    <td className="text-right tabular-nums">{r.artworks}</td>
                    <td className="text-right tabular-nums">{r.photos}</td>
                    <td className="text-right tabular-nums">{r.mediaGuessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
