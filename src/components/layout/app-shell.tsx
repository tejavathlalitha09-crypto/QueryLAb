"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Database,
  History,
  Bookmark,
  Table2,
  Sparkles,
  LayoutDashboard,
  Play,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  Menu,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/playground", label: "Playground", icon: Play },
  { href: "/history", label: "History", icon: History },
  { href: "/saved-queries", label: "Saved Queries", icon: Bookmark },
  { href: "/datasets", label: "Datasets", icon: Table2 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 h-full",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Terminal className="h-5 w-5 text-primary" />
            <span>QueryLab</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/login"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <LogIn className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign in</span>}
        </Link>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Demo mode</span>}
        </div>
      </div>
    </aside>
  );

  const mobileSidebar = mobileOpen ? (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Terminal className="h-5 w-5 text-primary" />
            <span>QueryLab</span>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  ) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebar}
      {mobileSidebar}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">PostgreSQL</span>
            <Badge>Demo</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
      {children}
    </span>
  );
}
