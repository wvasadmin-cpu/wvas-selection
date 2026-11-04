import AdminNav from "@/components/admin-nav";
import AdminSignIn from "@/components/admin-sign-in";
import CommitteeAddForm from "@/components/committee-add-form";
import CommitteeRow from "@/components/committee-row";
import { getAdminEmail } from "@/lib/admin";
import { getCommittee } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CommitteePage() {
  const email = await getAdminEmail();
  if (!email) return <AdminSignIn />;

  const members = await getCommittee();

  return (
    <section>
      <AdminNav email={email} />
      <h2 className="font-display text-3xl mb-2">Committee list</h2>
      <p className="mb-6 text-base-content/80">
        Voters type their own name; it&apos;s matched to this list (allowing for short forms like Sue for Susan), so the
        results page can show who hasn&apos;t voted yet. Voters never see this list.
      </p>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-2">
            {members.length} {members.length === 1 ? "member" : "members"}
          </h3>
          {members.length === 0 ? (
            <p className="text-base-content/70">No names yet. Add them using the box.</p>
          ) : (
            <ul>
              {members.map((m) => (
                <CommitteeRow key={`${m.id}-${m.name}`} member={m} />
              ))}
            </ul>
          )}
        </div>
        <CommitteeAddForm />
      </div>
    </section>
  );
}
