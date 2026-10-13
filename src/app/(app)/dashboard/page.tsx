"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  History,
  Bookmark,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Table2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatMs, formatDateTime } from "@/lib/utils";
import { loadLocalHistory } from "@/lib/store/local";
import { DATASETS } from "@/lib/sql/demo-data";

export default function DashboardPage() {
  const { push } = useToast();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<ReturnType<typeof loadLocalHistory>>([]);

  useState(() => {
    setHistory(loadLocalHistory());
    setMounted(true);
  });

  if (!mounted) return <PageSkeleton />;

  const total = history.length;
  const success = history.filter((h) => h.status === "success").length;
  const failed = total - success;
  const avgTime = total ? Math.round(history.reduce((a, h) => a + h.executionTimeMs, 0) / total) : 0;
  const recent = history.slice(0, 5);
  const trend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const key = day.toISOString().slice(0, 10);
    return {
      day: day.toLocaleDateString(undefined, { weekday: "short" }),
      queries: history.filter((h) => h.created_at.slice(0, 10) === key).length,
    };
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Demo mode — connect Supabase for personalized analytics.
          </p>
        </div>
        <Link href="/playground">
          <Button>
            <Play className="h-4 w-4" /> New query
          </Button>
        </Link>
      </div>

      <Badge variant="warning" className="mb-2">Demo mode</Badge>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Play} label="Queries executed" value={total} />
        <StatCard icon={CheckCircle2} label="Successful" value={success} tone="success" />
        <StatCard icon={XCircle} label="Failed" value={failed} tone="destructive" />
        <StatCard icon={Clock} label="Avg. time" value={formatMs(avgTime)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Queries this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <EmptyState
                icon={Play}
                title="No queries yet"
                action="Run your first query in the playground to see trends here."
                href="/playground"
                cta="Open playground"
              />
            ) : (
              <div className="flex items-end gap-2 h-32">
                {trend.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 min-h-[4px]"
                      style={{ height: `${Math.max(4, (d.queries / Math.max(1, ...trend.map((t) => t.queries))) * 100)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success rate */}
        <Card>
          <CardHeader>
            <CardTitle>Success rate</CardTitle>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24">
                  <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#232d4d" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#34d399" strokeWidth="4"
                      strokeDasharray={`${(success / total) * 100} 100`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {Math.round((success / total) * 100)}%
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success" /> {success} ok
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive" /> {failed} failed
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={History}
                title="Nothing here yet"
                action="Your executed queries will appear here."
                href="/playground"
                cta="Run a query"
              />
            ) : (
              <ul className="space-y-2">
                {recent.map((h) => (
                  <li key={h.id} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                    {h.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs truncate">{h.query_text.slice(0, 80)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDateTime(h.created_at)} · {formatMs(h.executionTimeMs)} · {h.rows_returned} rows
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Datasets + quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                Datasets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DATASETS.map((d) => (
                <Link
                  key={d.id}
                  href={`/datasets?dataset=${d.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.tables.length} tables</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/playground">
                <Button variant="outline" className="w-full justify-start">
                  <Play className="h-4 w-4" /> New query
                </Button>
              </Link>
              <Link href="/datasets">
                <Button variant="outline" className="w-full justify-start">
                  <Table2 className="h-4 w-4" /> Datasets
                </Button>
              </Link>
              <Link href="/saved-queries">
                <Button variant="outline" className="w-full justify-start">
                  <Bookmark className="h-4 w-4" /> Saved
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="h-4 w-4" /> Ask AI
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone?: "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <Icon className={cn("h-4 w-4", tone === "success" && "text-success", tone === "destructive" && "text-destructive")} />
          {label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  action,
  href,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  action: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/40 mb-2" />
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-3">{action}</p>
      <Link href={href}>
        <Button size="sm" variant="outline">{cta}</Button>
      </Link>
    </div>
  );
}
