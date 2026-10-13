import { NextResponse } from "next/server";
import { executeRequestSchema } from "@/lib/validation/schemas";
import { executeSql, executionEngine } from "@/lib/sql/executor";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = executeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { sql, limit, timeoutMs } = parsed.data;
  try {
    const result = await executeSql(sql, limit, timeoutMs);
    return NextResponse.json({ ok: true, status: "success", result, engine: result.engine });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Execution failed";
    const lineMatch = msg.match(/line (\d+)/);
    return NextResponse.json({
      ok: false,
      status: "error",
      error: { message: msg, line: lineMatch ? parseInt(lineMatch[1], 10) : undefined },
      engine: executionEngine(),
    });
  }
}
