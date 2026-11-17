import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import IntakeForm from "@/components/intake-form";
import { getAdminEmail } from "@/lib/admin";
import { intakeStatus } from "@/lib/intake";
import { getIntake } from "@/lib/store";

export const dynamic = "force-dynamic";

function siteUrl() {
  return (process.env.AUTH_URL ?? "https://wvas-selection.netlify.app").replace(/\/$/, "");
}

export default async function IntakePage() {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;
  const intake = await getIntake();
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
        . Link to it from the WVAS website.
      </p>
      <p className="mb-6">
        <span className={`badge ${status === "open" ? "badge-success" : "badge-neutral"}`}>{words[status]}</span>
      </p>
      <IntakeForm intake={intake} />
    </section>
  );
}
