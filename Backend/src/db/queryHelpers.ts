export type WhereEntry = { col: string; value: string; operator?: string };

export function buildWhere(
  entries: (WhereEntry | false | null | undefined)[],
): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  for (const entry of entries) {
    if (!entry) continue;
    params.push(entry.value);
    conditions.push(`${entry.col} ${entry.operator ?? "="} $${params.length}`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
