"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { QueryResult } from "@/types/query";
import { cn } from "@/lib/utils";

type ChartType = "bar" | "line" | "pie";

const COLORS = ["#22d3ee", "#8b5cf6", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#f472b6", "#a3e635"];

interface ChartSpec {
  type: ChartType;
  xKey: string;
  yKey: string;
  title: string;
}

function inferSpec(result: QueryResult): ChartSpec | null {
  const cols = result.columns;
  if (cols.length < 2 || result.rows.length === 0) return null;
  const numeric = cols.filter(
    (c) => result.rows.some((r) => typeof r[c.name] === "number") || c.type === "integer" || c.type === "numeric"
  );
  const categorical = cols.filter(
    (c) => !numeric.includes(c) && result.rows.some((r) => r[c.name] !== null && r[c.name] !== undefined)
  );
  const yKey = numeric.find((c) => c.name !== categorical[0]?.name)?.name ?? numeric[0]?.name;
  const xKey = categorical[0]?.name ?? cols.find((c) => c.name !== yKey)?.name;
  if (!xKey || !yKey) return null;
  const uniqueX = new Set(result.rows.map((r) => String(r[xKey]))).size;
  const type: ChartType = uniqueX <= 12 ? (numeric.length > 1 ? "bar" : "pie") : "line";
  return { type, xKey, yKey, title: `${yKey} by ${xKey}` };
}

export function ChartView({ result }: { result: QueryResult }) {
  const inferred = useMemo(() => inferSpec(result), [result]);
  const [type, setType] = useState<ChartType>(inferred?.type ?? "bar");
  const [xKey, setXKey] = useState(inferred?.xKey ?? result.columns[0]?.name ?? "");
  const [yKey, setYKey] = useState(inferred?.yKey ?? result.columns[1]?.name ?? "");

  if (!inferred) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-8 text-center">
        <div>
          <p className="font-medium text-foreground mb-1">Chart not available</p>
          <p>Charts need at least one categorical column and one numeric column.</p>
        </div>
      </div>
    );
  }

  const numericCols = result.columns.filter(
    (c) => result.rows.some((r) => typeof r[c.name] === "number") || c.type === "integer" || c.type === "numeric"
  );
  const data = result.rows.slice(0, 200).map((r) => ({
    ...r,
    [yKey]: typeof r[yKey] === "number" ? r[yKey] : Number(r[yKey]) || 0,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ChartType)}
            className="rounded border border-input bg-background px-1.5 py-1"
            aria-label="Chart type"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-muted-foreground">
          X axis
          <select
            value={xKey}
            onChange={(e) => setXKey(e.target.value)}
            className="rounded border border-input bg-background px-1.5 py-1 font-mono"
            aria-label="X axis column"
          >
            {result.columns.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-muted-foreground">
          Y axis
          <select
            value={yKey}
            onChange={(e) => setYKey(e.target.value)}
            className="rounded border border-input bg-background px-1.5 py-1 font-mono"
            aria-label="Y axis column"
          >
            {numericCols.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-muted-foreground">
          {inferred.title} · first 200 rows
        </span>
      </div>
      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232d4d" />
              <XAxis dataKey={xKey} stroke="#8b96ad" fontSize={11} angle={-25} textAnchor="end" interval={0} />
              <YAxis stroke="#8b96ad" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#131b36", border: "1px solid #232d4d", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e6eaf2" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={yKey} fill="#22d3ee" radius={[4, 4, 0, 0]} name={yKey} />
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232d4d" />
              <XAxis dataKey={xKey} stroke="#8b96ad" fontSize={11} angle={-25} textAnchor="end" interval={0} />
              <YAxis stroke="#8b96ad" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#131b36", border: "1px solid #232d4d", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e6eaf2" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey={yKey} stroke="#8b5cf6" strokeWidth={2} dot={false} name={yKey} />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{ background: "#131b36", border: "1px solid #232d4d", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius="70%" label={false}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
