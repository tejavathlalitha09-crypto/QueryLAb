import Link from "next/link";
import {
  Terminal,
  Play,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Database,
  History,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Terminal,
    title: "Interactive SQL Editor",
    description:
      "Syntax highlighting, auto-formatting, and Ctrl+Enter execution against a safe, read-only playground.",
  },
  {
    icon: BarChart3,
    title: "Visualize Results",
    description:
      "Switch between data grids and charts. QueryLab recommends the right chart for your result set.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Assistance",
    description:
      "Generate SQL from plain English, explain queries, debug errors, and get optimization tips via Gemini.",
  },
  {
    icon: ShieldCheck,
    title: "Safe by Design",
    description:
      "Read-only execution with statement validation, timeouts, and row limits. Your data stays protected.",
  },
  {
    icon: History,
    title: "Query History",
    description:
      "Every execution is tracked with timing and row counts. Re-run or revisit any past query.",
  },
  {
    icon: Bookmark,
    title: "Saved Queries",
    description:
      "Organize, tag, and favorite your best queries. Pick up where you left off, every time.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Pick a dataset",
    description: "Choose from e-commerce, education, or business analytics sample databases.",
  },
  {
    step: "02",
    title: "Write or generate SQL",
    description: "Type your own query or ask the AI assistant to write one from a description.",
  },
  {
    step: "03",
    title: "Run and visualize",
    description: "Execute safely, inspect results in a grid, and switch to charts instantly.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <Terminal className="h-6 w-6 text-primary" />
            QueryLab
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#ai" className="hover:text-foreground transition-colors">AI Assistant</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/playground">
              <Button size="sm">
                <Play className="h-4 w-4" />
                Open Playground
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <Badge variant="accent" className="mb-6">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-powered SQL workspace
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Your SQL Workspace,{" "}
          <span className="text-primary">Supercharged.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Write. Run. Understand. Optimize. QueryLab gives students, developers, and
          analysts a single place to write SQL, execute it safely, visualize results,
          and get AI help along the way.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/playground">
            <Button size="lg">
              <Play className="h-4 w-4" />
              Open Playground
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">
              Explore Features
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No sign-up required for the demo playground.
        </p>
      </section>

      {/* Product preview */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card p-2 shadow-xl">
          <div className="rounded-xl bg-[#0d1428] p-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-warning/70" />
              <span className="h-3 w-3 rounded-full bg-success/70" />
              <span className="ml-2">querylab — playground</span>
            </div>
            <pre className="text-foreground/90 overflow-x-auto">
              <code>{`SELECT c.name, SUM(o.total_amount) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.name
ORDER BY total_spent DESC
LIMIT 5;`}</code>
            </pre>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground">Status</div>
                <div className="text-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Success
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground">Duration</div>
                <div className="font-medium">12ms</div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground">Rows</div>
                <div className="font-medium">5 returned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-center">Everything you need to master SQL</h2>
          <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
            A complete workspace for writing, running, understanding, and optimizing queries.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <f.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold text-center">How it works</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-mono font-bold">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="accent" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by Google Gemini
            </Badge>
            <h2 className="text-3xl font-bold">AI that writes, explains, and optimizes SQL</h2>
            <p className="mt-4 text-muted-foreground">
              Describe what you need in plain English. QueryLab generates a correct,
              read-only query for the selected dialect and schema — then explains it,
              flags performance concerns, and suggests improvements.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Generate SQL from natural language",
                "Explain any query in simple terms",
                "Debug errors and optimize slow queries",
                "Convert between SQL dialects",
                "Practice with generated exercises",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/ai-assistant" className="inline-block mt-8">
              <Button>
                <Sparkles className="h-4 w-4" />
                Try the AI Assistant
              </Button>
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 font-mono text-sm">
            <div className="text-muted-foreground text-xs mb-2">You ask:</div>
            <p className="text-foreground">
              &ldquo;Find the top five customers by total spending during the last 90
              days.&rdquo;
            </p>
            <div className="mt-4 text-muted-foreground text-xs mb-2">QueryLab generates:</div>
            <pre className="text-primary/90 overflow-x-auto">
              <code>{`SELECT c.name, SUM(o.total_amount) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY c.name
ORDER BY total_spent DESC
LIMIT 5;`}</code>
            </pre>
            <div className="mt-4 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              <span className="text-warning font-medium">Performance tip:</span> an index on
              orders(customer_id, created_at) would speed up the filter and join.
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-success" />
                Execution guardrails
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Read-only SELECT enforcement via AST parsing",
                  "Multiple statements rejected",
                  "Statement timeouts and row limits",
                  "Least-privilege database role",
                  "Server-side validation on every request",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold">Security and privacy first</h2>
              <p className="mt-4 text-muted-foreground">
                QueryLab never runs arbitrary SQL with privileged credentials. Every
                query is validated, executed read-only, and bounded by timeouts and
                row limits. Your saved queries and history are protected by Row Level
                Security — only you can see them.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="success">Read-only</Badge>
                <Badge variant="success">RLS protected</Badge>
                <Badge variant="success">Rate limited</Badge>
                <Badge variant="success">No credential exposure</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Start querying in seconds</h2>
          <p className="mt-3 text-muted-foreground">
            Jump into the playground with sample datasets — no setup required.
          </p>
          <Link href="/playground" className="inline-block mt-8">
            <Button size="lg">
              <Play className="h-4 w-4" />
              Open Playground
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">QueryLab</span>
            <span>— Write. Run. Understand. Optimize.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#security" className="hover:text-foreground">Security</a>
            <Link href="/playground" className="hover:text-foreground">Playground</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <BookOpen className="h-4 w-4" />
            <Zap className="h-4 w-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
