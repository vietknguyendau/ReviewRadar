"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { STATUSES, statusLabel, ymd, type Lead } from "@/lib/constants";
import { mapsLinks, orderStops, totalKm, type Stop } from "@/lib/route";
import { ScorePill } from "@/components/ScorePill";
import { bulkDelete, bulkSetStatus } from "./actions";

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();
  const [route, setRoute] = useState<{ stops: Stop[]; links: string[]; km: number } | null>(null);

  const allOn = leads.length > 0 && sel.size === leads.length;
  const toggle = (id: number) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const ids = useMemo(() => [...sel], [sel]);

  function planRoute() {
    const stops = leads
      .filter((l) => sel.has(l.id) && l.lat != null && l.lng != null)
      .map((l) => ({ id: l.id, name: l.name, lat: l.lat!, lng: l.lng! }));
    const ordered = orderStops(stops);
    setRoute({ stops: ordered, links: mapsLinks(ordered), km: totalKm(ordered) });
  }

  if (!leads.length)
    return (
      <div className="card text-center text-slate-500">
        No leads match. <Link href="/discover" className="text-brand underline">Find some</Link>.
      </div>
    );

  return (
    <div className="space-y-3">
      {sel.size > 0 && (
        <div className="card sticky top-16 z-10 flex flex-wrap items-center gap-3 border-brand/40 bg-cyan-50 py-3">
          <span className="text-sm font-medium">{sel.size} selected</span>
          <button className="btn" onClick={planRoute}>Plan door-knock route</button>
          <select
            className="input w-auto"
            defaultValue=""
            disabled={pending}
            onChange={(e) => {
              const v = e.target.value;
              e.target.value = "";
              if (v) start(() => bulkSetStatus(ids, v));
            }}
          >
            <option value="">Move to stage…</option>
            {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button
            className="btn-ghost text-hot"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete ${sel.size} leads and their history?`)) start(async () => { await bulkDelete(ids); setSel(new Set()); });
            }}
          >
            Delete
          </button>
          <button className="btn-ghost" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      {route && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Door-knock route · {route.stops.length} stops · ~{route.km.toFixed(1)} km straight-line</h2>
            <button className="btn-ghost" onClick={() => setRoute(null)}>Close</button>
          </div>
          <ol className="grid list-decimal gap-1 pl-5 text-sm md:grid-cols-2">
            {route.stops.map((s) => <li key={s.id}><Link className="hover:underline" href={`/leads/${s.id}`}>{s.name}</Link></li>)}
          </ol>
          <div className="flex flex-wrap gap-2">
            {route.links.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="btn">Open in Google Maps{route.links.length > 1 ? ` (leg ${i + 1})` : ""}</a>
            ))}
          </div>
          <p className="text-xs text-slate-500">Order is nearest-next from the first selected stop. Print each lead&apos;s door-knock leave-behind from its page before you head out.</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-3"><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(leads.map((l) => l.id)))} /></th>
              <th className="p-3">Business</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Top pain → offer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="p-3"><input type="checkbox" checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                <td className="p-3">
                  <Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.name}</Link>
                  <div className="text-xs text-slate-500">{l.category} · {l.city ?? l.address}</div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  ★ {l.rating?.toFixed(1)} <span className="text-slate-400">({l.review_count})</span>
                  <div className="mt-1"><ScorePill score={l.score} /></div>
                </td>
                <td className="p-3">
                  {l.pain_points[0] ? (
                    <>
                      <div className="text-red-700">{l.pain_points[0].label}</div>
                      <div className="text-xs text-slate-500">{l.pain_points[0].offer}</div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Reputation / review response</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{l.phone ? <a href={`tel:${l.phone}`} className="text-brand hover:underline">{l.phone}</a> : "—"}</td>
                <td className="p-3 whitespace-nowrap">{statusLabel(l.status)}</td>
                <td className="p-3 whitespace-nowrap text-slate-500">{l.next_follow_up ? ymd(l.next_follow_up) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
