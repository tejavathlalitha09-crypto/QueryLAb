"use client";
import type { HistoryEntry, SavedQuery } from "@/types/query";

const HKEY = "querylab.history.v1";
const SKEY = "querylab.saved.v1";
const MAX_HISTORY = 100;

export function loadLocalHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addLocalHistory(e: Omit<HistoryEntry, "id" | "created_at">): HistoryEntry {
  const entry: HistoryEntry = {
    ...e,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  const all = [entry, ...loadLocalHistory()].slice(0, MAX_HISTORY);
  localStorage.setItem(HKEY, JSON.stringify(all));
  return entry;
}

export function deleteLocalHistory(id: string): void {
  localStorage.setItem(
    HKEY,
    JSON.stringify(loadLocalHistory().filter((h) => h.id !== id))
  );
}

export function clearLocalHistory(): void {
  localStorage.removeItem(HKEY);
}

export function loadLocalSaved(): SavedQuery[] {
  try {
    return JSON.parse(localStorage.getItem(SKEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveLocalSaved(q: SavedQuery): SavedQuery[] {
  const all = loadLocalHistory() && loadLocalSaved();
  const next = [q, ...all.filter((x) => x.id !== q.id)];
  localStorage.setItem(SKEY, JSON.stringify(next));
  return next;
}

export function deleteLocalSaved(id: string): SavedQuery[] {
  const next = loadLocalSaved().filter((x) => x.id !== id);
  localStorage.setItem(SKEY, JSON.stringify(next));
  return next;
}
