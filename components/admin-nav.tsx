import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function AdminNav({ email }: { email: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8 pb-3 border-b border-base-300 text-sm">
      <Link href="/admin" className="link link-hover font-semibold">
        Rounds
      </Link>
      <Link href="/admin/committee" className="link link-hover font-semibold">
        Committee list
      </Link>
      <span className="ml-auto text-base-content/60 truncate max-w-full">{email}</span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/admin" });
        }}
      >
        <button type="submit" className="link link-hover">
          Sign out
        </button>
      </form>
    </nav>
  );
}
