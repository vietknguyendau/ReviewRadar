import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Candidate } from "@/lib/places";

export const runtime = "nodejs";

/** Upsert candidates. Existing leads get fresh Google data but keep status, notes and history. */
export async function POST(req: Request) {
  try {
    const { candidates } = (await req.json()) as { candidates: Candidate[] };
    if (!Array.isArray(candidates) || !candidates.length) return NextResponse.json({ error: "Nothing to import" }, { status: 400 });
    const db = sql();
    let saved = 0;
    for (const c of candidates.slice(0, 200)) {
      await db`
        INSERT INTO leads (place_id, name, category, search_query, address, city, zip, lat, lng, phone, website, maps_url,
                           rating, review_count, pain_points, review_snippets, score)
        VALUES (${c.place_id}, ${c.name}, ${c.category}, ${c.search_query}, ${c.address}, ${c.city}, ${c.zip}, ${c.lat}, ${c.lng},
                ${c.phone}, ${c.website}, ${c.maps_url}, ${c.rating}, ${c.review_count},
                ${JSON.stringify(c.pain_points)}::jsonb, ${JSON.stringify(c.review_snippets)}::jsonb, ${c.score})
        ON CONFLICT (place_id) DO UPDATE SET
          name = EXCLUDED.name, category = EXCLUDED.category, address = EXCLUDED.address, city = EXCLUDED.city,
          zip = EXCLUDED.zip, lat = EXCLUDED.lat, lng = EXCLUDED.lng, phone = EXCLUDED.phone, website = EXCLUDED.website,
          maps_url = EXCLUDED.maps_url, rating = EXCLUDED.rating, review_count = EXCLUDED.review_count,
          pain_points = EXCLUDED.pain_points, review_snippets = EXCLUDED.review_snippets, score = EXCLUDED.score,
          refreshed_at = now(), updated_at = now()`;
      saved++;
    }
    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
