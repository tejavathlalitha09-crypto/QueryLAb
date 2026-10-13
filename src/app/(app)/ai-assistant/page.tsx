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
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { AiSqlResponse } from "@/types/ai";
import { getSchemaInfo } from "@/lib/sql/schema";

const ACTIONS = [
  { id: "generate", label: "Generate SQL", placeholder: "e.g. Find the top five customers by total spending during the last 90 days." },
  { id: "explain", label: "Explain SQL", placeholder: "Paste the SQL query to explain…" },
  { id: "optimize", label: "Optimize SQL", placeholder: "Paste the SQL query to optimize…" },
  { id: "debug", label: "Debug Error", placeholder: "Paste the failing SQL and describe the error…" },
  { id: "convert", label: "Convert Dialect", placeholder: "Paste SQL and describe the target dialect…" },
  { id: "practice", label: "Practice", placeholder: "e.g. Generate practice exercises about JOINs" },
  { id: "summarize", label: "Summarize Results", placeholder: "Paste query results or describe what to summarize…" },
] as const;

export default function AiAssistantPage() {
  const { push } = useToast();
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<string>("generate");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiSqlResponse | null>(null);
  const [history, setHistory] = useState<{ prompt: string; action: string; response: AiSqlResponse }[]>([]);

  const submit = async () => {
    if (!prompt.trim() && action === "generate") {
      push("warning", "Enter a prompt first.");
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ai/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt,
          dialect: "PostgreSQL",
          schema: getSchemaInfo().schemaText,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        push("error", data.error ?? "AI request failed.");
        return;
      }
      setResponse(data);
      setHistory((h) => [{ prompt, action, response: data }, ...h].slice(0, 10));
      if (data.demo) push("warning", "Demo mode: GEMINI_API_KEY not configured.");
    } catch {
      push("error", "Network error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const insertIntoPlayground = (sql: string) => {
    window.location.href = `/playground?q=${encodeURIComponent(sql)}`;
  };

  const activeAction = ACTIONS.find((a) => a.id === action)!;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          AI SQL Assistant
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate, explain, debug, and optimize SQL with Google Gemini.
        </p>
      </div>

      {/* Action selector */}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAction(a.id); setResponse(null); }}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              action === a.id
                ? "bg-accent/20 text-accent"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={activeAction.placeholder}
          className="min-h-[100px] resize-none"
          aria-label="AI prompt"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Schema context is included automatically.
          </p>
          <div className="flex gap-2">
            {response && (
              <Button variant="outline" size="sm" onClick={submit} disabled={loading}>
                <RotateCcw className="h-3.5 w-3.5" /> Retry
              </Button>
            )}
            <Button size="sm" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {loading ? "Thinking…" : "Ask AI"}
            </Button>
          </div>
        </div>
      </div>

      {/* Response */}
      {response && (
        <div className="space-y-4">
          {response.demo && (
            <Badge variant="warning">Demo mode — Gemini not configured</Badge>
          )}
          {response.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {response.error}
            </div>
          )}
          {response.sql && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Generated SQL</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(response.sql!);
                      push("info", "SQL copied.");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertIntoPlayground(response.sql!)}
                  >
                    <Play className="h-3.5 w-3.5" /> Open in Playground
                  </Button>
                </div>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs font-mono text-foreground/90 whitespace-pre-wrap">
                {response.sql}
              </pre>
              <p className="text-[10px] text-muted-foreground mt-2">
                Review generated SQL before executing. QueryLab runs read-only SELECT only.
              </p>
            </div>
          )}
          {response.explanation && (
            <Section title="Explanation">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{response.explanation}</p>
            </Section>
          )}
          {response.assumptions && response.assumptions.length > 0 && (
            <Section title="Assumptions">
              <ul className="text-sm space-y-1">
                {response.assumptions.map((a, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent mt-1">•</span> {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {response.performanceConcerns && response.performanceConcerns.length > 0 && (
            <Section title="Performance Concerns" icon={<Lightbulb className="h-3.5 w-3.5 text-warning" />}>
              <ul className="text-sm space-y-1">
                {response.performanceConcerns.map((p, i) => (
                  <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                    <span className="text-warning mt-1">•</span> {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {response.improvements && response.improvements.length > 0 && (
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
          {response.safetyWarning && (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              {response.safetyWarning}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && !response && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Recent</h3>
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li key={i}>
                <button
                  className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
                  onClick={() => {
                    setPrompt(h.prompt);
                    setAction(h.action);
                    setResponse(h.response);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="accent">{h.action}</Badge>
                    <span className="text-xs text-muted-foreground truncate">{h.prompt.slice(0, 80)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
