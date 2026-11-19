/** The society's bank details for paying the membership fee. */
export default function BankDetails({ reference }: { reference?: string }) {
  return (
    <dl className="rounded-box border-2 border-secondary bg-secondary/10 p-4 grid gap-1 grid-cols-[auto_1fr] gap-x-4">
      <dt className="font-semibold">Account name</dt>
      <dd>Welland Valley Art Society</dd>
      <dt className="font-semibold">Bank</dt>
      <dd>Lloyds Bank</dd>
      <dt className="font-semibold">Account number</dt>
      <dd className="tabular-nums">00249374</dd>
      <dt className="font-semibold">Sort code</dt>
      <dd className="tabular-nums">30-98-02</dd>
      <dt className="font-semibold">Reference</dt>
      <dd>
        {reference ? (
          <strong className="font-mono tracking-wide">{reference}</strong>
        ) : (
          "your surname and first initial (shown below once you've entered your name)"
        )}
      </dd>
    </dl>
  );
}
