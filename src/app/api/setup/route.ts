import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { SCHEMA_SQL } from "@/lib/schema";

export const runtime = "nodejs";

/** Creates tables (idempotent). Run once after connecting the database. */
export async function POST() {
  try {
    const statements = SCHEMA_SQL.split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const db = sql();
    for (const s of statements) await db.query(s);
    return NextResponse.json({ ok: true, statements: statements.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
