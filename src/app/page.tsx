import Link from "next/link";
import { sql, statusLabel, STATUSES, ymd, type Lead } from "@/lib/db";

export const dynamic = "force-dynamic";

async function load() {
  const db = sql();
  const [byStatus, due, week, top] = await Promise.all([
    db`SELECT status, count(*)::int AS n FROM leads GROUP BY status` as unknown as Promise<{ status: string; n: number }[]>,
    db`SELECT * FROM leads WHERE next_follow_up IS NOT NULL AND next_follow_up <= current_date
         AND status NOT IN ('won','lost','do_not_contact') ORDER BY next_follow_up LIMIT 15` as unknown as Promise<Lead[]>,
    db`SELECT type, count(*)::int AS n FROM activities WHERE created_at > now() - interval '7 days' GROUP BY type` as unknown as Promise<
      { type: string; n: number }[]
    >,
    db`SELECT * FROM leads WHERE status = 'new' ORDER BY score DESC LIMIT 8` as unknown as Promise<Lead[]>,
  ]);
  return { byStatus, due, week, top };
}

export default async function Dashboard() {
  let data: Awaited<ReturnType<typeof load>>;
  try {
    data = await load();
  } catch {
    return (
      <div className="card max-w-xl">
        <h1 className="mb-2 text-xl font-bold">Welcome to Review Radar</h1>
        <p className="mb-4 text-slate-600">The database isn&apos;t ready yet. Finish setup to start finding leads.</p>
        <Link href="/setup" className="btn">Go to setup</Link>
      </div>
    );
  }
  const count = (k: string) => data.byStatus.find((s) => s.status === k)?.n ?? 0;
  const total = data.byStatus.reduce((s, r) => s + r.n, 0);
  const acts = (t: string) => data.week.find((w) => w.type === t)?.n ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-600">{total} businesses in your pipeline</p>
        </div>
        <Link href="/discover" className="btn">+ Find new leads</Link>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ["Calls (7d)", acts("call") + acts("voicemail")],
          ["Door knocks (7d)", acts("door_knock")],
          ["Meetings set", count("meeting_set")],
          ["Proposals out", count("proposal")],
          ["Won", count("won")],
        ].map(([label, n]) => (
          <div key={label as string} className="card">
            <div className="text-3xl font-bold">{n}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link key={s.key} href={`/leads?status=${s.key}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="font-semibold">{count(s.key)}</span> <span className="text-slate-500">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-semibold">Follow-ups due</h2>
          {data.due.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing due. Nice.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.due.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link>
                  <span className="text-slate-500">{statusLabel(l.status)} · {ymd(l.next_follow_up)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3 font-semibold">Hottest untouched leads</h2>
          {data.top.length === 0 ? (
            <p className="text-sm text-slate-500">No new leads yet — run a search.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.top.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link>
                  <span className="text-slate-500">★ {l.rating?.toFixed(1)} · score {l.score}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
