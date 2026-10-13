"use client";

import { useState } from "react";
import Link from "next/link";
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatMs, formatDateTime } from "@/lib/utils";
import { loadLocalHistory, deleteLocalHistory, clearLocalHistory } from "@/lib/store/local";
import type { HistoryEntry } from "@/types/query";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { push } = useToast();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [page, setPage] = useState(1);

  useState(() => {
    setEntries(loadLocalHistory());
    setMounted(true);
  });

  if (!mounted) return <PageSkeleton />;

  const filtered = entries.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search && !e.query_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = (id: string) => {
    deleteLocalHistory(id);
    setEntries(loadLocalHistory());
    push("info", "History entry deleted.");
  };

  const clearAll = () => {
    if (!window.confirm("Delete all local history? This cannot be undone.")) return;
    clearLocalHistory();
    setEntries([]);
    push("info", "History cleared.");
  };

  const rerun = (sql: string) => {
    const params = new URLSearchParams({ q: sql });
    window.location.href = `/playground?${params.toString()}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Query History
          </h1>
          <p className="text-sm text-muted-foreground">
            Demo mode — stored locally in your browser.
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4" /> Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queries…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
            aria-label="Search history"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "success", "error"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium capitalize",
                statusFilter === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="font-medium text-sm">
                {entries.length === 0 ? "No history yet" : "No matches"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entries.length === 0
                  ? "Run queries in the playground to build history."
                  : "Try a different search or filter."}
              </p>
              {entries.length === 0 && (
                <Link href="/playground" className="mt-3">
                  <Button size="sm">
                    <Play className="h-4 w-4" /> Open playground
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pageItems.map((e) => (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  {e.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all line-clamp-2">
                      {e.query_text}
                    </pre>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      <span>{formatDateTime(e.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatMs(e.executionTimeMs)}
                      </span>
                      <Badge variant={e.status === "success" ? "success" : "destructive"}>
                        {e.status}
                      </Badge>
                      <span>{e.rows_returned} rows</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Re-run query"
                      onClick={() => rerun(e.query_text)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Link href={`/playground?q=${encodeURIComponent(e.query_text)}`}>
                      <Button variant="ghost" size="icon" aria-label="Open in playground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete entry"
                      onClick={() => remove(e.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
