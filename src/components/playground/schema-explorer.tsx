"use client";

import { useState } from "react";
import {
  Database,
  Table2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Link2,
  RefreshCw,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DATASETS, getDemoTables } from "@/lib/sql/demo-data";
import { cn } from "@/lib/utils";

export function SchemaExplorer({ onInsert }: { onInsert: (text: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ customers: true });
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const tables = getDemoTables();

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const filtered = DATASETS.map((ds) => ({
    ...ds,
    tables: ds.tables.filter(
      (t) =>
        t.toLowerCase().includes(search.toLowerCase()) ||
        tables[t]?.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((ds) => ds.tables.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          Schema
        </h2>
        <button
          aria-label="Refresh schema"
          onClick={refresh}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </button>
      </div>
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tables, columns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
            aria-label="Search schema"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filtered.map((ds) => (
          <div key={ds.id}>
            <div className="px-2 py-1 text-xs font-semibold text-accent uppercase tracking-wide">
              {ds.name}
            </div>
            {ds.tables.map((tn) => {
              const t = tables[tn];
              if (!t) return null;
              const isOpen = expanded[tn];
              return (
                <div key={tn}>
                  <button
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm hover:bg-secondary/60 text-left"
                    onClick={() => setExpanded((e) => ({ ...e, [tn]: !e[tn] }))}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Table2 className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-xs">{tn}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{t.rows.length}</span>
                  </button>
                  {isOpen && (
                    <div className="ml-4 border-l border-border pl-2 space-y-0.5">
                      {t.columns.map((c) => (
                        <button
                          key={c.name}
                          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-secondary/60 text-left font-mono"
                          onClick={() => onInsert(c.name)}
                          title={`${c.name}: ${c.type}${c.pk ? " (PK)" : ""}${c.fk ? ` → ${c.fk.table}.${c.fk.column}` : ""}`}
                        >
                          {c.pk && <KeyRound className="h-3 w-3 text-warning" />}
                          {c.fk && <Link2 className="h-3 w-3 text-accent" />}
                          {!c.pk && !c.fk && <span className="w-3" />}
                          <span className="text-foreground/90">{c.name}</span>
                          <span className="ml-auto text-muted-foreground text-[10px]">{c.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No matches.</p>
        )}
      </div>
    </div>
  );
}
