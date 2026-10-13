"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { format } from "sql-formatter";
import {
  Play,
  Square,
  Save,
  Sparkles,
  FileText,
  Wand2,
  Download,
  Copy,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Table2,
  BarChart3,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Link2,
  RefreshCw,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, formatMs } from "@/lib/utils";
import type { ExecutionStatus, QueryResult, QueryTab } from "@/types/query";
import { SchemaExplorer } from "./schema-explorer";
import { ResultsGrid } from "./results-grid";
import { ChartView } from "./chart-view";
import { AiPanel } from "./ai-panel";
import { SaveQueryDialog } from "./save-dialog";
import { toCsv, downloadFile, buildQueryReport } from "@/lib/exports/csv";
import { addLocalHistory } from "@/lib/store/local";

const EXAMPLES = [
  { label: "All customers", sql: "SELECT * FROM customers LIMIT 20;" },
  { label: "Top spenders", sql: `SELECT c.name, SUM(o.total_amount) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY total_spent DESC
LIMIT 5;` },
  { label: "Order status counts", sql: `SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC;` },
  { label: "Student grades", sql: `SELECT s.name, c.title, g.grade, g.score
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id
JOIN grades g ON g.enrollment_id = e.id
ORDER BY g.score DESC
LIMIT 10;` },
  { label: "Sales by department", sql: `SELECT d.name AS department, SUM(s.amount) AS total_sales
FROM sales s
JOIN employees e ON e.id = s.employee_id
JOIN departments d ON d.id = e.department_id
GROUP BY d.name
ORDER BY total_sales DESC;` },
];

let tabCounter = 1;
function newTab(sql = "", title?: string): QueryTab {
  const t: QueryTab = {
    id: `tab-${Date.now()}-${tabCounter}`,
    title: title ?? `Query ${tabCounter}`,
    sql,
    dirty: false,
  };
  tabCounter++;
  return t;
}

export function PlaygroundClient() {
  const { push } = useToast();
  const [tabs, setTabs] = useState<QueryTab[]>([newTab("SELECT * FROM customers LIMIT 20;")]);
  const [activeId, setActiveId] = useState(tabs[0].id);
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<{ message: string; line?: number } | null>(null);
  const [view, setView] = useState<"table" | "chart">("table");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [exampleOpen, setExampleOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const setSql = useCallback(
    (sql: string) => {
      setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, sql, dirty: true } : t)));
    },
    [activeId]
  );

  const runQuery = useCallback(async () => {
    if (status === "running") return;
    const sql = active.sql.trim();
    if (!sql) {
      push("warning", "Write a SQL query first.");
      return;
    }
    const runId = ++runIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("running");
    setError(null);
    const started = Date.now();
    try {
      const res = await fetch("/api/query/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, limit: 500, timeoutMs: 10000 }),
        signal: controller.signal,
      });
      if (runId !== runIdRef.current) return;
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? { message: "Execution failed" });
        addLocalHistory({
          query_text: sql,
          status: "error",
          executionTimeMs: Date.now() - started,
          rows_returned: 0,
          error_message: data.error?.message ?? "Execution failed",
        });
        return;
      }
      setStatus("success");
      setResult(data.result);
      addLocalHistory({
        query_text: sql,
        status: "success",
        executionTimeMs: data.result.executionTimeMs,
        rows_returned: data.result.rowCount,
        error_message: null,
      });
      push("success", `Query executed in ${formatMs(data.result.executionTimeMs)} — ${data.result.rowCount} rows.`);
    } catch (e) {
      if (runId !== runIdRef.current) return;
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("cancelled");
        push("info", "Query cancelled.");
      } else {
        setStatus("error");
        setError({ message: e instanceof Error ? e.message : "Network error" });
      }
    }
  }, [active.sql, status, push]);

  const stopQuery = useCallback(() => {
    abortRef.current?.abort();
    runIdRef.current++;
    setStatus("cancelled");
  }, []);

  const formatSql = useCallback(() => {
    try {
      setSql(format(active.sql, { language: "postgresql" }));
      push("info", "SQL formatted.");
    } catch {
      push("error", "Could not format — check for syntax errors.");
    }
  }, [active.sql, setSql, push]);

  const exportResults = useCallback(
    (kind: "csv" | "json" | "sql" | "report") => {
      if (!result) return;
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      if (kind === "csv") {
        downloadFile(`querylab-results-${stamp}.csv`, toCsv(result.columns.map((c) => c.name), result.rows), "text/csv");
      } else if (kind === "json") {
        downloadFile(`querylab-results-${stamp}.json`, JSON.stringify(result.rows, null, 2), "application/json");
      } else if (kind === "sql") {
        downloadFile(`querylab-query-${stamp}.sql`, active.sql, "text/plain");
      } else {
        downloadFile(
          `querylab-report-${stamp}.md`,
          buildQueryReport({
            sql: active.sql,
            status,
            durationMs: result.executionTimeMs,
            rowCount: result.rowCount,
            timestamp: new Date().toISOString(),
            scope: result.truncated ? `first ${result.rows.length} rows (truncated)` : "complete result set",
          }),
          "text/markdown"
        );
      }
      push("success", `Exported ${kind.toUpperCase()}.`);
    },
    [result, active.sql, status, push]
  );

  const copySql = useCallback(() => {
    navigator.clipboard.writeText(active.sql);
    push("info", "SQL copied to clipboard.");
  }, [active.sql, push]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((ts) => {
        if (ts.length === 1) return ts;
        const idx = ts.findIndex((t) => t.id === id);
        const next = ts.filter((t) => t.id !== id);
        if (id === activeId) setActiveId(next[Math.max(0, idx - 1)].id);
        return next;
      });
    },
    [activeId]
  );

  const addTab = useCallback(() => {
    const t = newTab("");
    setTabs((ts) => [...ts, t]);
    setActiveId(t.id);
  }, []);

  // Ctrl/Cmd+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runQuery();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runQuery]);

  const insertAtCursor = useCallback(
    (text: string) => {
      setSql(active.sql + (active.sql.endsWith(" ") || active.sql === "" ? "" : " ") + text);
    },
    [active.sql, setSql]
  );

  return (
    <div className="flex h-full">
      {/* Schema sidebar */}
      {sidebarOpen && (
        <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto hidden lg:block">
          <SchemaExplorer onInsert={insertAtCursor} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? "Hide schema" : "Show schema"}
            onClick={() => setSidebarOpen((s) => !s)}
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setExampleOpen((o) => !o)}>
              Examples <ChevronDown className="h-3 w-3" />
            </Button>
            {exampleOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-popover shadow-lg">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-secondary/60"
                    onClick={() => {
                      setSql(ex.sql);
                      setExampleOpen(false);
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="h-6 w-px bg-border" />
          {status === "running" ? (
            <Button variant="destructive" size="sm" onClick={stopQuery}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={runQuery}>
              <Play className="h-3.5 w-3.5" /> Run
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={formatSql} disabled={status === "running"}>
            <Wand2 className="h-3.5 w-3.5" /> Format
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)} disabled={status === "running"}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={() => setAiOpen((o) => !o)}>
            <Sparkles className="h-3.5 w-3.5" /> AI
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Copy SQL" onClick={copySql}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Export CSV" onClick={() => exportResults("csv")} disabled={!result}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border bg-card overflow-x-auto">
          {tabs.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-1 border-r border-border px-3 py-2 text-sm cursor-pointer select-none",
                t.id === activeId ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveId(t.id)}
              role="tab"
              aria-selected={t.id === activeId}
            >
              {t.dirty && <span className="h-2 w-2 rounded-full bg-warning mr-1" aria-label="Unsaved changes" />}
              <span className="max-w-[120px] truncate">{t.title}</span>
              {tabs.length > 1 && (
                <button
                  aria-label={`Close ${t.title}`}
                  className="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button aria-label="New tab" className="p-2 text-muted-foreground hover:text-foreground" onClick={addTab}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Editor + AI panel */}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={active.sql}
              onChange={(v) => setSql(v ?? "")}
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runQuery());
              }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                lineNumbers: "on",
                glyphMargin: false,
                folding: true,
                renderLineHighlight: "all",
                scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
              }}
              beforeMount={(monaco) => {
                monaco.languages.register({ id: "sql" });
                monaco.languages.setMonarchLanguageProvider("sql", {
                  tokenizer: {
                    root: [
                      [/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|OFFSET|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|ON|AS|AND|OR|NOT|IN|IS NULL|IS NOT NULL|BETWEEN|LIKE|DISTINCT|COUNT|SUM|AVG|MIN|MAX|HAVING|UNION|WITH|VALUES|CASE|WHEN|THEN|ELSE|END|CAST|EXTRACT|DATE_TRUNC|INTERVAL|CURRENT_DATE|ASC|DESC|NULLS FIRST|NULLS LAST)\b/i, "keyword"],
                      [/'[^']*'/, "string"],
                      [/\b\d+\b/, "number"],
                      [/[a-zA-Z_]\w*(?=\s*\()/, "type"],
                      [/[a-zA-Z_]\w*/, "identifier"],
                      [/--.*$/, "comment"],
                    ],
                  },
                });
                monaco.editor.defineTheme("vs-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "keyword", foreground: "22d3ee" },
                    { token: "string", foreground: "a5d6a7" },
                    { token: "number", foreground: "fbbf24" },
                    { token: "type", foreground: "8b5cf6" },
                    { token: "identifier", foreground: "e6eaf2" },
                    { token: "comment", foreground: "6b7394" },
                  ],
                  colors: {
                    "editor.background": "#0d1428",
                    "editor.lineHighlightBackground": "#161f3a",
                    "editorLineNumber.foreground": "#4a5578",
                    "editorCursor.foreground": "#22d3ee",
                  },
                });
              }}
            />
          </div>
          {aiOpen && (
            <div className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto hidden md:block">
              <AiPanel
                sql={active.sql}
                onInsert={(sql) => {
                  setSql(sql);
                  push("info", "AI SQL inserted into editor. Review before running.");
                }}
                onClose={() => setAiOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex flex-col border-t border-border bg-card" style={{ height: "45%" }}>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </Button>
            <Button
              variant={view === "chart" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("chart")}
              disabled={!result || result.rows.length === 0}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Chart
            </Button>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {status === "running" && (
                <span className="flex items-center gap-1 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…
                </span>
              )}
              {status === "success" && result && (
                <>
                  <Badge variant="success">
                    <Check className="h-3 w-3" /> Success
                  </Badge>
                  <span>{result.rowCount} rows</span>
                  <span>{formatMs(result.executionTimeMs)}</span>
                  {result.truncated && <Badge variant="warning">Truncated</Badge>}
                </>
              )}
              {status === "error" && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3" /> Error
                </Badge>
              )}
              {status === "cancelled" && <Badge variant="warning">Cancelled</Badge>}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {status === "running" ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Executing query…
              </div>
            ) : status === "error" && error ? (
              <div className="p-4">
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Query failed
                    {error.line && <Badge variant="destructive">Line {error.line}</Badge>}
                  </div>
                  <pre className="mt-2 text-sm whitespace-pre-wrap">{error.message}</pre>
                </div>
              </div>
            ) : result ? (
              view === "table" ? (
                <ResultsGrid result={result} />
              ) : (
                <ChartView result={result} />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Play className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Write a query and press Run (Ctrl+Enter)</p>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 border-t border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <KeyRound className="h-3 w-3" /> PostgreSQL
          </span>
          <span>Read-only</span>
          <span>Limit: 500 rows</span>
          <span>Timeout: 10s</span>
          <span className="ml-auto">{active.sql.length} chars</span>
        </div>
      </div>

      <SaveQueryDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        sql={active.sql}
        onSaved={() => {
          setSaveOpen(false);
          setTabs((ts) => ts.map((t) => (t.id === activeId ? { ...t, dirty: false } : t)));
          push("success", "Query saved.");
        }}
      />
    </div>
  );
}
