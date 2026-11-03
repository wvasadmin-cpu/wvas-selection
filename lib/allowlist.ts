export function isAllowedEmail(email: string | null | undefined, allowList: string | undefined): boolean {
  if (!email || !allowList) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return allowList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
