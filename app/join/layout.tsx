import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Welland Valley Art Society — Associate Membership Application",
  description: "Join the Welland Valley Art Society as an Associate Member.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader title="Associate Membership Application" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </>
  );
}
