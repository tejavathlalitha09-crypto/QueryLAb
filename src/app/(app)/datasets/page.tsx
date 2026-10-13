"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table2,
  Search,
  Play,
  KeyRound,
  Link2,
  Database,
  ChevronDown,
  ChevronRight,
  Rows3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DATASETS, getDemoTables } from "@/lib/sql/demo-data";

export default function DatasetsPage() {
  const params = useSearchParams();
  const initialDataset = params.get("dataset") ?? DATASETS[0].id;
  const [activeDataset, setActiveDataset] = useState(initialDataset);
  const [search, setSearch] = useState("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const ds = DATASETS.find((d) => d.id === activeDataset) ?? DATASETS[0];
  const tables = getDemoTables();

  const filteredTables = ds.tables.filter(
    (t) =>
      t.toLowerCase().includes(search.toLowerCase()) ||
      tables[t]?.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const startQuery = (tableName: string) => {
    const sql = `SELECT * FROM ${tableName} LIMIT 20;`;
    window.location.href = `/playground?q=${encodeURIComponent(sql)}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Data Explorer
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse seeded datasets, preview tables, and start queries.
        </p>
      </div>

      {/* Dataset tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {DATASETS.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDataset(d.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              d.id === activeDataset
                ? "bg-primary/15 text-primary"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            )}
          >
            {d.name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{ds.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{ds.description}</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48"
                aria-label="Search tables"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTables.map((tn) => {
            const t = tables[tn];
            if (!t) return null;
            const isOpen = expandedTable === tn;
            return (
              <div key={tn} className="rounded-lg border border-border overflow-hidden">
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary/40 text-left"
                  onClick={() => setExpandedTable(isOpen ? null : tn)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Table2 className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm">{tn}</span>
                  <Badge variant="secondary">{t.rows.length} rows</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{t.description}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                      {/* Columns */}
                      <div className="border-b lg:border-b-0 lg:border-r border-border p-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Columns
                        </h4>
                        <ul className="space-y-1">
                          {t.columns.map((c) => (
                            <li key={c.name} className="flex items-center gap-2 text-sm font-mono">
                              {c.pk && <KeyRound className="h-3 w-3 text-warning" />}
                              {c.fk && <Link2 className="h-3 w-3 text-accent" />}
                              {!c.pk && !c.fk && <span className="w-3" />}
                              <span>{c.name}</span>
                              <span className="text-muted-foreground text-xs ml-auto">{c.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Preview */}
                      <div className="border-b lg:border-b-0 lg:border-r border-border p-4 lg:col-span-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Rows3 className="h-3 w-3" /> Preview (first 5 rows)
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono">
                            <thead>
                              <tr className="border-b border-border">
                                {t.columns.map((c) => (
                                  <th key={c.name} className="px-2 py-1 text-left font-medium text-muted-foreground">
                                    {c.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {t.rows.slice(0, 5).map((r, i) => (
                                <tr key={i} className="border-b border-border/50">
                                  {t.columns.map((c) => (
                                    <td key={c.name} className="px-2 py-1 text-foreground/80">
                                      {r[c.name] === null ? (
                                        <span className="text-muted-foreground/50 italic">NULL</span>
                                      ) : (
                                        String(r[c.name])
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Button size="sm" className="mt-3" onClick={() => startQuery(tn)}>
                          <Play className="h-3.5 w-3.5" /> Query this table
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredTables.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No tables match.</p>
          )}
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card>
        <CardHeader>
          <CardTitle>Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              orders.customer_id → customers.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              order_items.order_id → orders.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              order_items.product_id → products.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              enrollments.student_id → students.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              enrollments.course_id → courses.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              grades.enrollment_id → enrollments.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              employees.department_id → departments.id
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4 text-accent" />
              sales.employee_id → employees.id
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
