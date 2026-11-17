"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { saveIntake } from "@/lib/store";

export type IntakeFormState = { ok: boolean; message: string } | null;

export async function saveIntakeAction(_prev: IntakeFormState, formData: FormData): Promise<IntakeFormState> {
  await requireAdmin();
  const roundName = String(formData.get("roundName") ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const closesOn = String(formData.get("closesOn") ?? "");
  const viewing = String(formData.get("viewing") ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  const open = formData.get("open") === "on";
  if (!roundName) return { ok: false, message: "Please give the round name, e.g. March 27." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closesOn)) return { ok: false, message: "Please choose the closing date." };
  await saveIntake({ roundName, closesOn, viewing, open });
  revalidatePath("/admin/intake");
  revalidatePath("/apply");
  return { ok: true, message: "Saved." };
}
