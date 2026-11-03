"use client";

export default function PrintButton({ label = "Print summary" }: { label?: string }) {
  return (
    <button type="button" className="btn btn-primary print:hidden" onClick={() => window.print()}>
      {label}
    </button>
  );
}
