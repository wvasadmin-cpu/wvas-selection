import "server-only";
import { isAllowedEmail } from "./allowlist";
import { auth } from "./auth";

/** The signed-in admin's email, or null. Re-checks the allowlist on every call. */
export async function getAdminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isAllowedEmail(email, process.env.ADMIN_EMAILS) ? email : null;
}

/** For server actions: stop unless an allowed admin is signed in. */
export async function requireAdmin(): Promise<string> {
  const email = await getAdminEmail();
  if (!email) throw new Error("Not signed in as an admin.");
  return email;
}
