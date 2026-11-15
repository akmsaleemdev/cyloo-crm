export function campaignSpendFromSnapshot(snapshot: unknown): number {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) return 0;

  const values = snapshot as Record<string, unknown>;
  const amount = Number(values.spend ?? values.budget ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
