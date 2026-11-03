import type { ActionState } from "@/actions/rounds";

export default function ActionMessage({ state }: { state: ActionState }) {
  return (
    <p aria-live="polite" className={`text-sm ${state?.ok ? "text-success" : "text-error"}`}>
      {state?.message}
    </p>
  );
}
