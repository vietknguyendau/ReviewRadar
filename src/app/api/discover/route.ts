import { NextResponse } from "next/server";
import { discover } from "@/lib/places";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { category?: string; area?: string; maxRating?: number; minReviews?: number; pages?: number };
    const category = (b.category ?? "").trim();
    const area = (b.area ?? "").trim();
    if (!category || !area) return NextResponse.json({ error: "Category and area are required" }, { status: 400 });

    const { candidates, scanned } = await discover({
      category,
      area,
      maxRating: Math.min(5, Math.max(1, Number(b.maxRating ?? 3.9))),
      minReviews: Math.max(0, Number(b.minReviews ?? 10)),
      maxPages: Math.min(3, Math.max(1, Number(b.pages ?? 3))),
    });

    // Flag which ones are already in the pipeline.
    let existing: string[] = [];
    if (candidates.length && process.env.DATABASE_URL) {
      const ids = candidates.map((c) => c.place_id);
      const rows = (await sql()`SELECT place_id FROM leads WHERE place_id = ANY(${ids})`) as { place_id: string }[];
      existing = rows.map((r) => r.place_id);
    }
    return NextResponse.json({ scanned, candidates, existing });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
