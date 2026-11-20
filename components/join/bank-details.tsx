import { BANK } from "@/lib/society";

/** The society's bank details for paying the membership fee. */
export default function BankDetails({ reference }: { reference?: string }) {
  return (
    <dl className="rounded-box border-2 border-secondary bg-secondary/10 p-4 grid gap-1 grid-cols-[auto_1fr] gap-x-4">
      <dt className="font-semibold">Account name</dt>
      <dd>{BANK.accountName}</dd>
      <dt className="font-semibold">Bank</dt>
      <dd>{BANK.bank}</dd>
      <dt className="font-semibold">Account number</dt>
      <dd className="tabular-nums">{BANK.accountNumber}</dd>
      <dt className="font-semibold">Sort code</dt>
      <dd className="tabular-nums">{BANK.sortCode}</dd>
      <dt className="font-semibold">Reference</dt>
      <dd>
        {reference ? (
          <strong className="font-mono tracking-wide">{reference}</strong>
        ) : (
          <span className="text-base-content/60">
            your surname and first initial: appears here once you&apos;ve entered your name
          </span>
        )}
      </dd>
    </dl>
  );
}
