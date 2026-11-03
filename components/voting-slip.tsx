import type { Applicant } from "@/lib/types";

// One A5-landscape paper voting slip for the judging session: artwork details
// and Yes/No boxes, no voter name (paper votes are anonymous). Initials only.
export default function VotingSlip({
  roundId,
  roundName,
  applicant,
}: {
  roundId: string;
  roundName: string;
  applicant: Applicant;
}) {
  return (
    <div className="slip">
      <header className="slip-header">
        <div>
          <p className="slip-kicker">WVAS Exhibitor Application Judging</p>
          <p className="slip-round">{roundName}</p>
        </div>
        <p className="slip-applicant">Applicant {applicant.initials}</p>
        <p className="slip-date">Date: ____________</p>
      </header>

      <div className="slip-body">
        <ol className="slip-artworks">
          {applicant.artworks.map((art) => (
            <li key={art.id} className="slip-artwork">
              <div className="slip-thumb">
                {art.hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/images/${roundId}/${art.id}`} alt="" />
                ) : (
                  <span>No photo</span>
                )}
              </div>
              <p className="slip-title">
                {art.slot}. {art.title}
              </p>
              {art.medium && <p className="slip-medium">{art.medium}</p>}
              <p className="slip-boxes">
                <span>☐ Yes</span>
                <span>☐ No</span>
              </p>
            </li>
          ))}
        </ol>

        <div className="slip-feedback">
          <p className="slip-feedback-label">Feedback</p>
          <div className="slip-lines" aria-hidden="true">
            {Array.from({ length: 13 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <p className="slip-overleaf">(continue overleaf)</p>
        </div>
      </div>
    </div>
  );
}
