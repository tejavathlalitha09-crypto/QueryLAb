"use client";

import { useState } from "react";
import {
  Sparkles,
  Send,
  Copy,
  Play,
  Loader2,
  AlertCircle,
  Lightbulb,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { AiSqlResponse } from "@/types/ai";
import { getSchemaInfo } from "@/lib/sql/schema";

interface AiPanelProps {
  sql: string;
  onInsert: (sql: string) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: "Generate SQL", action: "generate", placeholder: "e.g. Find the top five customers by total spending during the last 90 days." },
  { label: "Explain query", action: "explain", placeholder: "Paste or describe what to explain…" },
  { label: "Optimize query", action: "optimize", placeholder: "Paste the query to optimize…" },
  { label: "Debug error", action: "debug", placeholder: "Describe the error or paste the failing query…" },
];

export function AiPanel({ sql, onInsert, onClose }: AiPanelProps) {
  const { push } = useToast();
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiSqlResponse | null>(null);

  const submit = async (a?: string) => {
    const act = (a ?? action) as typeof action;
    const body = {
      action: act,
      prompt: prompt || (act === "explain" || act === "optimize" || act === "debug" ? sql : ""),
      dialect: "PostgreSQL",
      schema: getSchemaInfo().schemaText,
      sql: sql || undefined,
    };
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ai/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        push("error", data.error ?? "AI request failed.");
        return;
      }
      setResponse(data);
      if (data.demo) push("warning", "Demo mode: GEMINI_API_KEY not configured. Showing fallback response.");
    } catch {
      push("error", "Network error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    if (response?.sql) {
      navigator.clipboard.writeText(response.sql);
      push("info", "SQL copied.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Assistant
        </h2>
        <button aria-label="Close AI panel" onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-border p-3">
        <div className="flex flex-wrap gap-1 mb-2">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.action}
              onClick={() => setAction(qa.action)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                action === qa.action
                  ? "bg-accent/20 text-accent"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {qa.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={QUICK_ACTIONS.find((q) => q.action === action)?.placeholder}
            className="min-h-[60px] text-xs resize-none"
            aria-label="AI prompt"
          />
        </div>
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={() => submit()}
          disabled={loading || (!prompt && action === "generate")}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {loading ? "Thinking…" : "Ask AI"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {response?.error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {response.error}
          </div>
        )}
        {response?.demo && (
          <Badge variant="warning">Demo mode — Gemini not configured</Badge>
        )}
        {response?.sql && (
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Generated SQL</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={copySql} aria-label="Copy SQL">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onInsert(response.sql!)} aria-label="Insert into editor">
                  <Play className="h-3 w-3" /> Insert
                </Button>
              </div>
            </div>
            <pre className="overflow-x-auto rounded bg-card p-2 text-xs font-mono text-foreground/90 whitespace-pre-wrap">
              {response.sql}
            </pre>
          </div>
        )}
        {response?.explanation && (
          <Section title="Explanation">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{response.explanation}</p>
          </Section>
        )}
        {response?.assumptions && response.assumptions.length > 0 && (
          <Section title="Assumptions">
            <ul className="text-sm space-y-1">
              {response.assumptions.map((a, i) => (
                <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary mt-1">•</span> {a}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {response?.performanceConcerns && response.performanceConcerns.length > 0 && (
          <Section title="Performance" icon={<Lightbulb className="h-3.5 w-3.5 text-warning" />}>
            <ul className="text-sm space-y-1">
              {response.performanceConcerns.map((p, i) => (
                <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                  <span className="text-warning mt-1">•</span> {p}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {response?.improvements && response.improvements.length > 0 && (
          <Section title="Suggestions" icon={<Lightbulb className="h-3.5 w-3.5 text-success" />}>
            <ul className="text-sm space-y-1">
              {response.improvements.map((s, i) => (
                <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                  <span className="text-success mt-1">•</span> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {response?.safetyWarning && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            {response.safetyWarning}
          </div>
        )}
        {!response && !loading && (
          <div className="text-center text-xs text-muted-foreground py-8">
            <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-40" />
            Ask the AI to generate, explain, debug, or optimize SQL.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
