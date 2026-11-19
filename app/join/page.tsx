import JoinForm from "@/components/join/join-form";

const BENEFITS = [
  "reduced-fee access to WVAS workshops",
  "email updates and information about events",
  "occasional trips",
  "our summer ‘en plein air’ programme",
  "WVAS newsletters",
  "private view invitations to the Spring and Autumn exhibitions at Stamford Arts Centre",
  "voting at the AGM",
];

export default function JoinPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h2 className="font-display text-3xl">Welland Valley Art Society Associate Member Application</h2>
        <p>By joining WVAS as an Associate Member you will benefit from:</p>
        <ul className="list-disc pl-6 space-y-1">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p>We encourage all members to join the committee for a period of their membership when vacancies arise.</p>
      </header>

      <section className="space-y-3">
        <h3 className="font-display text-xl">How to join</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <p>
              Pay the <strong>£10 annual fee</strong> by bank transfer:
            </p>
            <dl className="mt-2 rounded-box border-2 border-secondary bg-secondary/10 p-4 grid gap-1 grid-cols-[auto_1fr] gap-x-4">
              <dt className="font-semibold">Account name</dt>
              <dd>Welland Valley Art Society</dd>
              <dt className="font-semibold">Bank</dt>
              <dd>Lloyds Bank</dd>
              <dt className="font-semibold">Account number</dt>
              <dd className="tabular-nums">00249374</dd>
              <dt className="font-semibold">Sort code</dt>
              <dd className="tabular-nums">30-98-02</dd>
              <dt className="font-semibold">Reference</dt>
              <dd>your surname and first initial (shown below once you&apos;ve entered your name)</dd>
            </dl>
          </li>
          <li>Complete the form below and submit it.</li>
        </ol>
        <p>
          Applications can&apos;t be processed until payment has been received. The Membership Secretary will then send you a
          welcome email with your Associate membership details.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xl">Exhibitor Membership</h3>
        <p>
          Should you wish to apply to be an Exhibitor Member at a later date, the requirements and application form can be
          found on the WVAS website.
        </p>
      </section>

      <p className="text-sm italic text-base-content/70">
        The Welland Valley Art Society collects personal data from its members solely for the purposes of managing
        membership, communications and society activities. We do not sell, share or pass on your personal data to any third
        party for marketing or commercial purposes. Your data is held securely and used only in accordance with our
        obligations under UK GDPR. You may ask to view, update or remove your data at any time by contacting the Membership
        Secretary: WVASMembersec@gmail.com
      </p>

      <hr className="border-base-300" />

      <JoinForm />
    </div>
  );
}
