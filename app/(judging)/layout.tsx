import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Welland Valley Art Society — Exhibitor Applicant Preview/Remote Judging" };

export default function JudgingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="Exhibitor Applicant Preview/Remote Judging" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </>
  );
}
