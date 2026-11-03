"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-primary print:hidden" onClick={() => window.print()}>
      Print summary
    </button>
  );
}
