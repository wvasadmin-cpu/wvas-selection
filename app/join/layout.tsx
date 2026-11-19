import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import { FORM_THEME } from "@/lib/form-theme";

export const metadata: Metadata = {
  title: "Welland Valley Art Society — Associate Membership Application",
  description: "Join the Welland Valley Art Society as an Associate Member.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    // The application forms can have their own colour scheme (FORM_THEME), separate
    // from the exhibition green and gold used by the judging and admin pages.
    <div data-theme={FORM_THEME} data-form-theme className="min-h-screen bg-base-100 text-base-content">
      <SiteHeader title="Associate Membership Application" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
