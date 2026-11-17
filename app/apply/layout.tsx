import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Welland Valley Art Society — Exhibitor Membership Application",
  description: "Apply to become an exhibiting member of the Welland Valley Art Society.",
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="Exhibitor Membership Application" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </>
  );
}
