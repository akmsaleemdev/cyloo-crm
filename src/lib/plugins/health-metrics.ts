/** Missing or malformed samples contribute zero instead of poisoning the mean. */
export function averageErrorRate(rows: readonly { error_rate?: unknown }[]): number {
  if (!rows.length) return 0;
  return (
    rows.reduce((sum, row) => {
      const rate = Number(row.error_rate);
      return sum + (Number.isFinite(rate) ? rate : 0);
    }, 0) / rows.length
  );
}
