import { sql, ymd, type Lead } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = (await sql()`SELECT * FROM leads ORDER BY score DESC`) as Lead[];
  const header = ["name", "category", "status", "score", "rating", "review_count", "phone", "website", "address", "city", "zip",
    "top_pain_point", "suggested_offer", "next_follow_up", "notes", "maps_url"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.name, r.category, r.status, r.score, r.rating, r.review_count, r.phone, r.website, r.address, r.city, r.zip,
        r.pain_points[0]?.label, r.pain_points[0]?.offer, ymd(r.next_follow_up), r.notes, r.maps_url].map(csvCell).join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
