import { notFound } from "next/navigation";
import { getRound } from "@/lib/store";

export const dynamic = "force-dynamic";

// Placeholder until the voting pages are built.
export default async function VotePage({ params }: { params: Promise<{ roundId: string }> }) {
  const round = await getRound((await params).roundId);
  if (!round) notFound();

  return (
    <section className="max-w-2xl">
      <h2 className="font-display text-3xl mb-4">Exhibitor applications: {round.name}</h2>
      <p className="text-base-content/80">
        {round.status === "closed"
          ? "Voting for this round has closed."
          : "The voting pages are being finished. You'll be sent the link when they're ready."}
      </p>
    </section>
  );
}
