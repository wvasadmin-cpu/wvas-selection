import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail } from "./allowlist";

// Google sign-in for the admin pages only. Committee voters never sign in.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  // Show sign-in problems (e.g. an email not on the list) on our own admin page.
  pages: { signIn: "/admin", error: "/admin" },
  callbacks: {
    // Allowlist gate: only listed emails may complete sign-in.
    signIn({ profile, user }) {
      const email = profile?.email ?? user?.email ?? null;
      return isAllowedEmail(email, process.env.ADMIN_EMAILS);
    },
  },
});
