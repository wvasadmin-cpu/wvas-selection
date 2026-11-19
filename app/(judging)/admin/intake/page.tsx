import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import IntakeForm from "@/components/intake-form";
import { getAdminEmail } from "@/lib/admin";
import { intakeStatus } from "@/lib/intake";
import { getApplyProblem, getIntake } from "@/lib/store";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.AUTH_URL ?? "https://wvas-selection.netlify.app").replace(/\/$/, "");
}

export default async function IntakePage() {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;
  const [intake, problem] = await Promise.all([getIntake(), getApplyProblem()]);
  const hasWriteToken = Boolean(process.env.AIRTABLE_WRITE_TOKEN);
  const hasMembersTable = Boolean(process.env.AIRTABLE_MEMBERS_TABLE);
  const status = intakeStatus(intake);
  const words = { open: "Open: accepting applications", closed: "Closed", "not-set": "Not set up yet" };

  return (
    <section>
      <AdminNav email={email} />
      <h2 className="font-display text-3xl mb-2">Exhibitor applications</h2>
      <p className="mb-2 text-base-content/80">
        The application form is at{" "}
        <a href={`${siteUrl()}/apply`} className="link font-mono" target="_blank" rel="noreferrer">
          {siteUrl()}/apply
        </a>
        . Link to it from the WVAS website. The associate membership form (always open) is at{" "}
        <a href={`${siteUrl()}/join`} className="link font-mono" target="_blank" rel="noreferrer">
          {siteUrl()}/join
        </a>
        .
      </p>
      <p className="mb-6">
        <span className={`badge ${status === "open" ? "badge-success" : "badge-neutral"}`}>{words[status]}</span>
      </p>
      <IntakeForm intake={intake} />

      <div className="mt-10 max-w-xl rounded-box border border-base-300 bg-base-100 p-4 space-y-2 text-sm">
        <h3 className="font-semibold">Connection check</h3>
        <p>
          Write token (AIRTABLE_WRITE_TOKEN):{" "}
          {hasWriteToken ? (
            <span className="text-success font-semibold">found</span>
          ) : (
            <span className="text-error font-semibold">
              not found: add it in Netlify (available to Functions), then Trigger deploy
            </span>
          )}
        </p>
        <p>
          Members table for the associate form (AIRTABLE_MEMBERS_TABLE):{" "}
          {hasMembersTable ? (
            <span className="text-success font-semibold">found</span>
          ) : (
            <span className="text-error font-semibold">not found: add it in Netlify, then Trigger deploy</span>
          )}
        </p>
        {problem ? (
          <p>
            Last problem sending an application (
            {new Date(problem.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}
            ): <span className="font-mono text-error break-words">{problem.detail}</span>
          </p>
        ) : (
          <p>No problems sending applications so far.</p>
        )}
      </div>
    </section>
  );
}
