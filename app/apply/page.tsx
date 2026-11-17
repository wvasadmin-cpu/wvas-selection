import ApplicationForm from "@/components/apply/application-form";
import { ACCEPTED_MEDIA } from "@/components/apply/accepted-media";
import { intakeStatus, longDate } from "@/lib/intake";
import { getIntake } from "@/lib/store";

export const dynamic = "force-dynamic";

const CRITERIA = [
  { name: "Cohesion", detail: "A consistent, quality body of work" },
  { name: "Technical skill", detail: "Effective use of medium, materials and processes" },
  { name: "Originality", detail: "Evidence of individuality, creativity and engagement" },
  { name: "Presentation", detail: "Professional, exhibition-ready standard" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-xl">{title}</h3>
      <div className="space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default async function ApplyPage() {
  const intake = await getIntake();
  const status = intakeStatus(intake);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h2 className="font-display text-3xl">Welland Valley Art Society Exhibitor Membership Application</h2>
        {intake && status !== "not-set" && (
          <dl className="rounded-box border-2 border-secondary bg-secondary/10 p-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="font-semibold">Applications close</dt>
            <dd>{longDate(intake.closesOn)}</dd>
            {intake.viewing && (
              <>
                <dt className="font-semibold">Viewing and voting</dt>
                <dd>{intake.viewing}</dd>
              </>
            )}
          </dl>
        )}
        <p>Please read the information below, then complete the form.</p>
      </header>

      <Section title="What to submit">
        <p>
          Please submit photographs, titles and media of <strong>six</strong> original examples of 2D work, or{" "}
          <strong>four</strong> original examples of 3D work, preferably made within the last three years. If your work is
          a mixture of 2D and 3D, please submit six in total.
        </p>
        <p>
          Three of the 2D works must be framed or presented to exhibition standard. The remaining three should be properly
          mounted if not framed.
        </p>
      </Section>

      <Section title="On the viewing day">
        <p>
          Please bring an artist statement, sketchbooks, ideas, preparatory work or anything else that will help the
          committee understand your submission. This supporting material will not be judged, but may help the committee
          understand your creative process.
        </p>
      </Section>

      <Section title="How work is judged">
        <p>Works are judged on artistic merit against the following criteria:</p>
        <ul className="list-disc pl-6 space-y-1">
          {CRITERIA.map((c) => (
            <li key={c.name}>
              <strong>{c.name}:</strong> {c.detail}
            </li>
          ))}
        </ul>
        <details className="rounded-box border border-base-300 bg-base-100 p-3">
          <summary className="cursor-pointer font-semibold">Accepted media, methods and materials</summary>
          <div className="mt-2 space-y-2 text-sm">
            <p>{ACCEPTED_MEDIA.join(", ")}.</p>
            <p>
              Any of these media may be combined, and further combined with other materials such as fabrics, frottage and
              collage. 3D work may be made by any of the four basic processes: carving, modelling, casting or constructing.
            </p>
            <p>
              <em>Reproductions of original works, digital artwork and AI-assisted processes are not accepted.</em>
            </p>
          </div>
        </details>
      </Section>

      <Section title="If your application is successful">
        <p>
          You will be eligible to enter work in the Society&apos;s two annual exhibitions at Stamford Arts Centre, in spring
          and autumn. Members are expected to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>steward a minimum of three sessions at WVAS exhibitions in which their work is displayed</li>
          <li>volunteer at exhibition set-up and take-down</li>
          <li>attend AGMs, private views and social events</li>
          <li>support the Society&apos;s growth.</li>
        </ul>
        <p>We encourage all members to join the committee for a period of their membership when vacancies arise.</p>
      </Section>

      <Section title="If your application is unsuccessful">
        <p>
          The committee will endeavour to give constructive feedback. An unsuccessful application does not prevent you from
          applying again, and we encourage you to re-apply, taking account of any advice given.
        </p>
      </Section>

      <p className="text-sm italic text-base-content/70">
        The Welland Valley Art Society collects personal data from its members solely for the purposes of managing
        membership, communications and society activities. We do not sell, share or pass on your personal data to any third
        party for marketing or commercial purposes. Your data is held securely and used only in accordance with our
        obligations under UK GDPR. You may ask to view, update or remove your data at any time by contacting the Membership
        Secretary: WVASMembersec@gmail.com
      </p>

      <hr className="border-base-300" />

      {status === "open" ? (
        <ApplicationForm />
      ) : (
        <div role="status" className="alert">
          {status === "closed"
            ? "Applications for this round are now closed. Thank you for your interest; please check back for the next round."
            : "Applications are not open at the moment. Please check back soon."}
        </div>
      )}
    </div>
  );
}
