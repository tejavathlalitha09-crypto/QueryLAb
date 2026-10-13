"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveLocalSaved } from "@/lib/store/local";
import type { SavedQuery } from "@/types/query";

const schema = z.object({
  title: z.string().min(1, "Title required").max(120),
  description: z.string().max(1000).optional(),
  dialect: z.string().max(32).default("PostgreSQL"),
  tags: z.string().max(200).optional().default(""),
});
type Form = z.infer<typeof schema>;

export function SaveQueryDialog({
  open,
  onClose,
  sql,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  sql: string;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", dialect: "PostgreSQL", tags: "" },
  });

  if (!open) return null;

  const onSubmit = async (values: Form) => {
    const q: SavedQuery = {
      id: `local-${Date.now()}`,
      title: values.title,
      description: values.description,
      sql_text: sql,
      dialect: values.dialect,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveLocalSaved(q);
    reset();
    push("success", "Query saved locally.");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Save query">
      <div className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Save query</h2>
          <button aria-label="Close" onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Input placeholder="Title *" {...register("title")} aria-label="Query title" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div>
            <Textarea placeholder="Description (optional)" {...register("description")} aria-label="Query description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input placeholder="Dialect" {...register("dialect")} aria-label="SQL dialect" />
            </div>
            <div>
              <Input placeholder="Tags (comma separated)" {...register("tags")} aria-label="Tags" />
            </div>
          </div>
          <pre className="max-h-32 overflow-auto rounded-lg border border-border bg-background p-3 text-xs font-mono text-foreground/80">
            {sql.slice(0, 500)}{sql.length > 500 ? "…" : ""}
          </pre>
          <p className="text-xs text-muted-foreground">
            Saved queries are stored in your browser (demo mode). Connect Supabase for cloud persistence.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
