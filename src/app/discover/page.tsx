"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_PRESETS } from "@/lib/categories";
import type { Candidate } from "@/lib/places";
import { ScorePill } from "@/components/ScorePill";

const DEFAULT_AREA = process.env.NEXT_PUBLIC_DEFAULT_CITY || "Minneapolis, MN";

export default function DiscoverPage() {
  const [category, setCategory] = useState("HVAC contractor");
  const [area, setArea] = useState(DEFAULT_AREA);
  const [maxRating, setMaxRating] = useState(3.9);
  const [minReviews, setMinReviews] = useState(10);
  const [pages, setPages] = useState(3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ scanned: number; candidates: Candidate[]; existing: string[] } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveMsg, setSaveMsg] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setSaveMsg("");
    setResult(null);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        body: JSON.stringify({ category, area, maxRating, minReviews, pages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setSelected(new Set(data.candidates.filter((c: Candidate) => !data.existing.includes(c.place_id)).map((c: Candidate) => c.place_id)));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!result) return;
    const picks = result.candidates.filter((c) => selected.has(c.place_id));
    setBusy(true);
    const res = await fetch("/api/leads/import", { method: "POST", body: JSON.stringify({ candidates: picks }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setSaveMsg(`Error: ${data.error}`);
    setSaveMsg(`Saved ${data.saved} leads to your pipeline.`);
    setResult({ ...result, existing: [...result.existing, ...picks.map((p) => p.place_id)] });
    setSelected(new Set());
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const offerCounts = useMemo(() => {
    const m = new Map<string, number>();
    result?.candidates.forEach((c) => c.pain_points.forEach((p) => m.set(p.offer, (m.get(p.offer) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [result]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find leads</h1>
        <p className="text-slate-600">Search Google for businesses with weak ratings, then read what their unhappy customers say.</p>
      </div>

      <form onSubmit={search} className="card grid gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="label">Business type</label>
          <input className="input" list="cats" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="cats">{CATEGORY_PRESETS.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="md:col-span-2">
          <label className="label">Area (city, neighborhood or ZIP)</label>
          <input className="input" value={area} onChange={(e) => setArea(e.target.value)} />
        </div>
        <div>
          <label className="label">Max rating ★</label>
          <input className="input" type="number" step="0.1" min={1} max={5} value={maxRating} onChange={(e) => setMaxRating(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Min # reviews</label>
          <input className="input" type="number" min={0} value={minReviews} onChange={(e) => setMinReviews(Number(e.target.value))} />
        </div>
        <div className="flex items-end gap-3 md:col-span-6">
          <button className="btn" disabled={busy}>{busy ? "Scanning Google…" : "Search"}</button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Depth
            <select className="input w-auto" value={pages} onChange={(e) => setPages(Number(e.target.value))}>
              <option value={1}>20 results</option>
              <option value={2}>40 results</option>
              <option value={3}>60 results (max)</option>
            </select>
          </label>
          <span className="text-xs text-slate-400">Tip: search by neighborhood or suburb (e.g. &quot;dentist in Edina, MN&quot;) to go deeper than 60.</span>
        </div>
      </form>

      {err && <div className="card border-red-200 bg-red-50 text-sm text-hot">{err}</div>}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Scanned <b>{result.scanned}</b> businesses → <b>{result.candidates.length}</b> at or below {maxRating}★ with {minReviews}+ reviews.
            </p>
            <div className="flex items-center gap-3">
              {saveMsg && <span className="text-sm text-emerald-700">{saveMsg} <Link className="underline" href="/leads">View pipeline</Link></span>}
              <button className="btn" onClick={save} disabled={busy || selected.size === 0}>Save {selected.size} to pipeline</button>
            </div>
          </div>

          {offerCounts.length > 0 && (
            <div className="card">
              <div className="label">What this market needs most</div>
              <div className="flex flex-wrap gap-2">
                {offerCounts.map(([offer, n]) => (
                  <span key={offer} className="pill bg-cyan-50 text-brand-dark">{offer} · {n}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {result.candidates.map((c) => {
              const saved = result.existing.includes(c.place_id);
              return (
                <div key={c.place_id} className={`card flex gap-4 ${saved ? "opacity-60" : ""}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={selected.has(c.place_id)} onChange={() => toggle(c.place_id)} disabled={saved} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <span className="pill bg-amber-100 text-amber-800">★ {c.rating?.toFixed(1)} ({c.review_count})</span>
                      <ScorePill score={c.score} />
                      {!c.website && <span className="pill bg-violet-100 text-violet-800">No website</span>}
                      {saved && <span className="pill bg-slate-200 text-slate-700">In pipeline</span>}
                    </div>
                    <div className="text-sm text-slate-500">{c.category} · {c.address} {c.phone && `· ${c.phone}`}</div>
                    {c.pain_points.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.pain_points.map((p) => (
                          <span key={p.key} className="pill bg-red-50 text-red-700" title={p.examples.join("\n\n")}>{p.label} ×{p.count}</span>
                        ))}
                      </div>
                    )}
                    {c.review_snippets[0] && (
                      <p className="line-clamp-2 text-sm text-slate-600 italic">&ldquo;{c.review_snippets[0].text}&rdquo;</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
