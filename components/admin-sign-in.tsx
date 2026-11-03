import { signIn } from "@/lib/auth";

export default function AdminSignIn({ error }: { error?: string }) {
  return (
    <section className="max-w-md">
      <h2 className="font-display text-3xl mb-3">Admin sign-in</h2>
      <p className="mb-5 text-base-content/80">
        These pages are for the Membership Secretary. Committee members don&apos;t need to sign in: they use the voting link
        sent by email.
      </p>
      {error && (
        <div role="alert" className="alert alert-error mb-5">
          {error === "AccessDenied"
            ? "That Google account isn't on the admin list."
            : "Sign-in didn't work. Please try again."}
        </div>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
      >
        <button type="submit" className="btn btn-primary">
          Sign in with Google
        </button>
      </form>
    </section>
  );
}
