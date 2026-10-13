"use client";

import { useState } from "react";
import {
  Bookmark,
  Search,
  Star,
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateTime } from "@/lib/utils";
import { loadLocalSaved, deleteLocalSaved, saveLocalSaved } from "@/lib/store/local";
import type { SavedQuery } from "@/types/query";

export default function SavedQueriesPage() {
  const { push } = useToast();
  const [mounted, setMounted] = useState(false);
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  useState(() => {
    setQueries(loadLocalSaved());
    setMounted(true);
  });

  if (!mounted) return <PageSkeleton />;

  const allTags = [...new Set(queries.flatMap((q) => q.tags))];
  const filtered = queries.filter((q) => {
    if (tagFilter && !q.tags.includes(tagFilter)) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.title.toLowerCase().includes(s) ||
        (q.description ?? "").toLowerCase().includes(s) ||
        q.sql_text.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const remove = (id: string) => {
    if (!window.confirm("Delete this saved query?")) return;
    setQueries(deleteLocalSaved(id));
    push("info", "Query deleted.");
  };

  const duplicate = (q: SavedQuery) => {
    const copy: SavedQuery = {
      ...q,
      id: `local-${Date.now()}`,
      title: `${q.title} (copy)`,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setQueries(saveLocalSaved(copy));
    push("success", "Query duplicated.");
  };

  const toggleFavorite = (q: SavedQuery) => {
    const updated = { ...q, is_favorite: !q.is_favorite, updated_at: new Date().toISOString() };
    setQueries(saveLocalSaved(updated));
  };

  const openInPlayground = (q: SavedQuery) => {
    window.location.href = `/playground?q=${encodeURIComponent(q.sql_text)}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            Saved Queries
          </h1>
          <p className="text-sm text-muted-foreground">
            Demo mode — stored locally in your browser.
          </p>
        </div>
        <a href="/playground">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New query
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, description, SQL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search saved queries"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTagFilter("")}
              className={cnTag("", tagFilter)}
            >
              All
            </button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTagFilter(t)} className={cnTag(t, tagFilter)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="font-medium text-sm">
              {queries.length === 0 ? "No saved queries yet" : "No matches"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {queries.length === 0
                ? "Save queries from the playground to see them here."
                : "Try a different search or tag."}
            </p>
            {queries.length === 0 && (
              <a href="/playground" className="mt-3">
                <Button size="sm" variant="outline">
                  <Play className="h-4 w-4" /> Open playground
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{q.title}</CardTitle>
                    {q.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{q.description}</p>
                    )}
                  </div>
                  <button
                    aria-label={q.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    onClick={() => toggleFavorite(q)}
                    className="shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        q.is_favorite ? "fill-warning text-warning" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{q.dialect}</Badge>
                  {q.tags.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <pre className="max-h-24 overflow-auto rounded-lg border border-border bg-background p-2 text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                  {q.sql_text}
                </pre>
                <div className="flex items-center gap-1 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openInPlayground(q)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Duplicate"
                    onClick={() => duplicate(q)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => remove(q.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {formatDateTime(q.updated_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cnTag(tag: string, active: string) {
  return `rounded-full px-2.5 py-1 text-xs font-medium ${
    tag === active ? "bg-primary/15 text-primary" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
  }`;
}
