import { NextResponse } from "next/server";
import { sql, type Lead } from "@/lib/db";
import { aiPrompt } from "@/lib/scripts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 400 });
  const rows = (await sql()`SELECT * FROM leads WHERE id = ${Number(id)}`) as Lead[];
  const lead = rows[0];
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 900,
      messages: [{ role: "user", content: aiPrompt(lead) }],
    }),
  });
  if (!res.ok) return NextResponse.json({ error: `Claude API error ${res.status}: ${(await res.text()).slice(0, 300)}` }, { status: 502 });
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
  await sql()`UPDATE leads SET ai_script = ${text}, updated_at = now() WHERE id = ${lead.id}`;
  return NextResponse.json({ script: text });
}
