import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, STATUSES, ACTIVITY_TYPES, OUTCOMES, ymd, type Activity, type Lead } from "@/lib/db";
import { buildScripts } from "@/lib/scripts";
import { ScorePill } from "@/components/ScorePill";
import { logActivity, updateLead, deleteActivity } from "../actions";
import LeadTools from "./LeadTools";

export const dynamic = "force-dynamic";

const label = (list: readonly { key: string; label: string }[], k: string | null) => list.find((x) => x.key === k)?.label ?? k ?? "";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId)) notFound();
  const db = sql();
  const [leads, acts] = await Promise.all([
    db`SELECT * FROM leads WHERE id = ${leadId}` as unknown as Promise<Lead[]>,
    db`SELECT * FROM activities WHERE lead_id = ${leadId} ORDER BY created_at DESC` as unknown as Promise<Activity[]>,
  ]);
  const lead = leads[0];
  if (!lead) notFound();
  const scripts = buildScripts(lead);
  const today = new Date().toISOString().slice(0, 10);
  const followDefault = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const stale = Date.now() - new Date(lead.refreshed_at).getTime() > 25 * 864e5;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="text-sm text-slate-500 hover:underline">← Pipeline</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="pill bg-amber-100 text-amber-800">★ {lead.rating?.toFixed(1)} · {lead.review_count} reviews</span>
            <ScorePill score={lead.score} />
            <span>{lead.category}</span>
            {!lead.website && <span className="pill bg-violet-100 text-violet-800">No website</span>}
          </div>
          <div className="mt-2 text-sm text-slate-600">{lead.address}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.phone && <a href={`tel:${lead.phone}`} className="btn">Call {lead.phone}</a>}
          {lead.maps_url && <a href={lead.maps_url} target="_blank" rel="noreferrer" className="btn-ghost">Google Maps</a>}
          {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="btn-ghost">Website</a>}
        </div>
      </div>

      {stale && (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Google data is over 25 days old — hit &ldquo;Refresh from Google&rdquo; below before you reach out.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="mb-3 font-semibold">What customers are complaining about</h2>
            {lead.pain_points.length === 0 ? (
              <p className="text-sm text-slate-500">No specific pattern detected in the reviews Google returned (it only shares 5). Lead with review-response automation, and read their reviews on Maps for specifics.</p>
            ) : (
              <div className="space-y-3">
                {lead.pain_points.map((p) => (
                  <div key={p.key} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-red-700">{p.label} <span className="text-slate-400">×{p.count}</span></span>
                      <span className="pill bg-cyan-50 text-brand-dark">Pitch: {p.offer}</span>
                    </div>
                    {p.examples.map((ex, i) => <p key={i} className="mt-2 text-sm text-slate-600 italic">&ldquo;{ex}&rdquo;</p>)}
                  </div>
                ))}
              </div>
            )}
            {lead.review_snippets.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-brand">Read {lead.review_snippets.length} negative reviews</summary>
                <div className="mt-2 space-y-2">
                  {lead.review_snippets.map((r, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                      <div className="mb-1 text-xs text-slate-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.when}</div>
                      {r.text}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">Outreach scripts</h2>
            <div className="space-y-3">
              {scripts.map((s, i) => (
                <details key={s.title} open={i === 0} className="rounded-lg border border-slate-200">
                  <summary className="cursor-pointer px-4 py-2 font-medium">{s.title}</summary>
                  <pre className="px-4 pb-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{s.body}</pre>
                </details>
              ))}
            </div>
            <LeadTools leadId={lead.id} initialScript={lead.ai_script} aiEnabled={!!process.env.ANTHROPIC_API_KEY} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-3 font-semibold">Log a touch</h2>
            <form action={logActivity.bind(null, lead.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select name="type" className="input" defaultValue="call">
                  {ACTIVITY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <select name="outcome" className="input" defaultValue="">
                  <option value="">Outcome…</option>
                  {OUTCOMES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
              <textarea name="notes" className="input" rows={3} placeholder="Who you talked to, objections, next step…" />
              <div>
                <label className="label">Next follow-up</label>
                <input type="date" name="next_follow_up" className="input" defaultValue={followDefault} min={today} />
              </div>
              <button className="btn w-full">Save touch</button>
            </form>
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">Lead details</h2>
            <form action={updateLead.bind(null, lead.id)} className="space-y-3">
              <div>
                <label className="label">Stage</label>
                <select name="status" className="input" defaultValue={lead.status}>
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Owner / decision-maker</label>
                <input name="owner" className="input" defaultValue={lead.owner ?? ""} placeholder="Name, title" />
              </div>
              <div>
                <label className="label">Follow-up date</label>
                <input type="date" name="next_follow_up" className="input" defaultValue={lead.next_follow_up ? ymd(lead.next_follow_up) : ""} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea name="notes" className="input" rows={4} defaultValue={lead.notes ?? ""} />
              </div>
              <button className="btn-ghost w-full">Update</button>
            </form>
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">History</h2>
            {acts.length === 0 ? (
              <p className="text-sm text-slate-500">No touches yet.</p>
            ) : (
              <ul className="space-y-3">
                {acts.map((a) => (
                  <li key={a.id} className="border-l-2 border-brand/40 pl-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{label(ACTIVITY_TYPES, a.type)}{a.outcome ? ` · ${label(OUTCOMES, a.outcome)}` : ""}</span>
                      <form action={deleteActivity.bind(null, lead.id, a.id)}>
                        <button className="text-xs text-slate-400 hover:text-hot" title="Delete">✕</button>
                      </form>
                    </div>
                    <div className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}</div>
                    {a.notes && <p className="mt-1 text-slate-600">{a.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
