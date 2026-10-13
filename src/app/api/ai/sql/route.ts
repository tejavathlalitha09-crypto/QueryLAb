import { NextResponse } from "next/server";
import { aiSqlRequestSchema } from "@/lib/ai/validation";
import { isGeminiConfigured, runGemini, fallbackResponse } from "@/lib/ai/gemini";
import { getSchemaInfo } from "@/lib/sql/schema";

// Simple in-memory rate limiter (per server instance)
const buckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  b.count++;
  return b.count > RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = aiSqlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const { schemaText } = getSchemaInfo();

  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json({
        ok: true,
        action: input.action,
        ...fallbackResponse(input.action, input.prompt),
        model: "demo-fallback",
        demo: true,
      });
    }
    const result = await runGemini(input.action, {
      prompt: input.prompt,
      sql: input.sql,
      error: input.error,
      targetDialect: input.targetDialect,
      dialect: input.dialect,
      schema: input.schema || schemaText,
    });
    return NextResponse.json({ ok: true, action: input.action, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json(
      { ok: false, action: input.action, error: `AI service error: ${msg}` },
      { status: 502 }
    );
  }
}
