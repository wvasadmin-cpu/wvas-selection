import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import PrintButton from "@/components/print-button";
import VotingSlip from "@/components/voting-slip";
import { getAdminEmail } from "@/lib/admin";
import { getCommittee, getRound, listBallots } from "@/lib/store";
import { summariseRound } from "@/lib/tally";
import type { Applicant } from "@/lib/types";
import "./slips.css";

export const dynamic = "force-dynamic";

const MAX_COPIES = 40;

/** Pair slips up, two to an A4 sheet. */
function sheetsOf<T>(slips: T[]): T[][] {
  const sheets: T[][] = [];
  for (let i = 0; i < slips.length; i += 2) sheets.push(slips.slice(i, i + 2));
  return sheets;
}

export default async function SlipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ copies?: string }>;
}) {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;

  const { roundId } = await params;
  const [round, ballots, members] = await Promise.all([getRound(roundId), listBallots(roundId), getCommittee()]);
  if (!round) notFound();

  // Default: a slip for everyone who hasn't already voted online.
  const votedOnline = summariseRound(round.applicants, ballots, members).responses.complete.length;
  const suggested = Math.max(1, members.length - votedOnline);
  const requested = Number((await searchParams).copies);
  const copies = Number.isInteger(requested) && requested >= 1 ? Math.min(requested, MAX_COPIES) : suggested;

  // All copies for applicant 1, then applicant 2, and so on: one pile per applicant.
  const slips: { key: string; applicant: Applicant }[] = round.applicants.flatMap((applicant) =>
    Array.from({ length: copies }, (_, i) => ({ key: `${applicant.id}-${i}`, applicant })),
  );
  const sheets = sheetsOf(slips);

  return (
    <section>
      <div className="print:hidden">
        <AdminNav email={email} />
        <p className="text-sm mb-2">
          <Link href={`/admin/results/${round.id}`} className="link link-hover">
            ← Results: {round.name}
          </Link>
        </p>
        <h2 className="font-display text-3xl mb-2">Paper voting slips: {round.name}</h2>
        <p className="mb-4 text-base-content/80 max-w-2xl">
          One A5 slip per applicant, printed two to an A4 sheet: cut along the dashed line. Slips have no name on them, so
          paper votes stay anonymous. They&apos;re grouped by applicant, so you get one pile per applicant.
        </p>
        <form className="flex flex-wrap items-end gap-3 mb-3">
          <div>
            <label htmlFor="copies" className="block text-sm font-semibold mb-1">
              Copies of each slip
            </label>
            <input
              id="copies"
              name="copies"
              type="number"
              min={1}
              max={MAX_COPIES}
              defaultValue={copies}
              className="input input-bordered w-28"
            />
          </div>
          <button type="submit" className="btn">
            Update
          </button>
          <PrintButton label="Print slips" />
        </form>
        <p className="text-sm text-base-content/70 mb-8">
          Suggested {suggested}: the {members.length} committee members less the {votedOnline} who have voted online.{" "}
          {slips.length} slips on {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}. In the print box, choose A4,
          portrait, and margins &ldquo;None&rdquo; (or &ldquo;Default&rdquo;).
        </p>
      </div>

      <div className="slip-sheets">
        {sheets.map((sheet, i) => (
          <div key={i} className="slip-sheet">
            {sheet.map(({ key, applicant }) => (
              <VotingSlip key={key} roundId={round.id} roundName={round.name} applicant={applicant} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
