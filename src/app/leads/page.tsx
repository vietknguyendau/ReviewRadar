import Link from "next/link";
import { sql, STATUSES, type Lead } from "@/lib/db";
import LeadsTable from "./LeadsTable";

export const dynamic = "force-dynamic";

type SP = { status?: string; q?: string; minScore?: string; sort?: string; city?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();
  const minScore = Number(sp.minScore ?? 0) || 0;
  const city = (sp.city ?? "").trim();
  const sort = sp.sort ?? "score";

  const like = `%${q}%`;
  const cityLike = `%${city}%`;
  const rows = (await sql()`
    SELECT * FROM leads
    WHERE (${status}::text = '' OR status = ${status})
      AND (${status}::text <> '' OR status <> 'do_not_contact')
      AND (${q}::text = '' OR name ILIKE ${like} OR category ILIKE ${like} OR search_query ILIKE ${like})
      AND (${city}::text = '' OR city ILIKE ${cityLike} OR zip ILIKE ${cityLike} OR address ILIKE ${cityLike})
      AND score >= ${minScore}::int
    ORDER BY
      CASE WHEN ${sort}::text = 'rating' THEN rating END ASC NULLS LAST,
      CASE WHEN ${sort}::text = 'reviews' THEN review_count END DESC NULLS LAST,
      CASE WHEN ${sort}::text = 'followup' THEN next_follow_up END ASC NULLS LAST,
      CASE WHEN ${sort}::text = 'recent' THEN updated_at END DESC,
      score DESC
    LIMIT 500`) as Lead[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-slate-600">{rows.length} leads{status ? ` · ${STATUSES.find((s) => s.key === status)?.label}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/leads/export" className="btn-ghost">Export CSV</a>
          <Link href="/discover" className="btn">+ Find leads</Link>
        </div>
      </div>

      <form className="card grid gap-3 md:grid-cols-6" method="get">
        <div className="md:col-span-2">
          <label className="label">Search</label>
          <input className="input" name="q" defaultValue={q} placeholder="Name or type" />
        </div>
        <div>
          <label className="label">City / ZIP</label>
          <input className="input" name="city" defaultValue={city} />
        </div>
        <div>
          <label className="label">Stage</label>
          <select className="input" name="status" defaultValue={status}>
            <option value="">All active</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Min score</label>
          <input className="input" type="number" name="minScore" defaultValue={minScore || ""} min={0} max={100} />
        </div>
        <div>
          <label className="label">Sort</label>
          <select className="input" name="sort" defaultValue={sort}>
            <option value="score">Best opportunity</option>
            <option value="rating">Lowest rating</option>
            <option value="reviews">Most reviews</option>
            <option value="followup">Follow-up date</option>
            <option value="recent">Recently updated</option>
          </select>
        </div>
        <div className="flex gap-2 md:col-span-6">
          <button className="btn">Apply</button>
          <Link href="/leads" className="btn-ghost">Reset</Link>
        </div>
      </form>

      <LeadsTable leads={rows} />
    </div>
  );
}
