export function toCsv(
  columns: string[],
  rows: Record<string, unknown>[]
): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map(escape).join(",")];
  for (const row of rows) lines.push(columns.map((c) => escape(row[c])).join(","));
  return lines.join("\r\n");
}

export function downloadFile(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildQueryReport(opts: {
  sql: string;
  status: string;
  durationMs: number;
  rowCount: number;
  timestamp: string;
  scope: string;
}): string {
  return [
    `# QueryLab Report`,
    ``,
    `- Timestamp: ${opts.timestamp}`,
    `- Status: ${opts.status}`,
    `- Duration: ${Math.round(opts.durationMs)}ms`,
    `- Rows: ${opts.rowCount} (${opts.scope})`,
    ``,
    `## SQL`,
    "```sql",
    opts.sql,
    "```",
  ].join("\n");
}
