import { NextResponse } from "next/server";
import { sql, type Lead } from "@/lib/db";
import { placeDetails } from "@/lib/places";
import { detectPainPoints, opportunityScore } from "@/lib/painpoints";

export const runtime = "nodejs";

/** Re-pull rating + reviews from Google (keeps data fresh; Google's terms limit long-term caching). */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const rows = (await sql()`SELECT * FROM leads WHERE id = ${Number(id)}`) as Lead[];
    const lead = rows[0];
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const d = await placeDetails(lead.place_id);
    const snippets = (d.reviews ?? [])
      .map((r) => ({ rating: r.rating, text: (r.originalText?.text ?? r.text?.text ?? "").trim(), when: r.relativePublishTimeDescription }))
      .filter((r) => r.text);
    const pains = detectPainPoints(snippets);
    const score = opportunityScore({
      rating: d.rating ?? lead.rating,
      reviewCount: d.userRatingCount ?? lead.review_count,
      pains,
      hasPhone: !!lead.phone,
      hasWebsite: !!lead.website,
    });
    await sql()`
      UPDATE leads SET rating = ${d.rating ?? lead.rating}, review_count = ${d.userRatingCount ?? lead.review_count},
        pain_points = ${JSON.stringify(pains)}::jsonb,
        review_snippets = ${JSON.stringify(snippets.filter((s) => s.rating <= 3).slice(0, 5))}::jsonb,
        score = ${score}, refreshed_at = now(), updated_at = now()
      WHERE id = ${lead.id}`;
    return NextResponse.json({ ok: true, score });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
