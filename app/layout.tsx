import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Welland Valley Art Society — Exhibitor Applicant Preview/Remote Judging",
  description: "Committee judging of new exhibitor applications.",
  // Private committee site: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA?.substring(0, 7) || "dev";

  return (
    <html lang="en-GB" data-theme="gallery" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body style={{ fontFamily: "var(--font-source-sans), sans-serif" }}>
        <SiteHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <div className="fixed bottom-2 right-3 text-[10px] text-base-content/30 font-mono pointer-events-none select-none print:hidden">
          rev {commitSha}
        </div>
      </body>
    </html>
  );
}
