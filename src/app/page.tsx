"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_GROUPS } from "@/lib/categories";
import { AREA_GROUPS, AREA_PRESETS } from "@/lib/areas";
import type { Candidate } from "@/lib/places";
import { ScorePill } from "@/components/ScorePill";

const CUSTOM = "__custom__";
type Row = Candidate & { area: string };

export default function DiscoverPage() {
  const [categoryPick, setCategoryPick] = useState("HVAC contractor");
  const [customCategory, setCustomCategory] = useState("");
  const [areas, setAreas] = useState<Set<string>>(new Set(["Minneapolis, MN", "St. Paul, MN"]));
  const [extraArea, setExtraArea] = useState("");
  const [showAreas, setShowAreas] = useState(false);
  const [maxRating, setMaxRating] = useState(3.9);
  const [minReviews, setMinReviews] = useState(10);
  const [pages, setPages] = useState(3);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveMsg, setSaveMsg] = useState("");

  const category = categoryPick === CUSTOM ? customCategory.trim() : categoryPick;
  const areaList = [...areas];

  function toggleArea(a: string) {
    setAreas((s) => {
      const n = new Set(s);
      if (n.has(a)) n.delete(a);
      else n.add(a);
      return n;
    });
  }

  function addExtraArea() {
    const a = extraArea.trim();
    if (!a) return;
    setAreas((s) => new Set(s).add(a));
    setExtraArea("");
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return setErrors(["Pick or type a business type."]);
    if (!areaList.length) return setErrors(["Pick at least one area."]);
    setBusy(true);
    setErrors([]);
    setSaveMsg("");
    setRows([]);
    setScanned(0);

    const byId = new Map<string, Row>();
    const seenExisting = new Set<string>();
    const errs: string[] = [];
    let total = 0;

    // One request per area keeps each call well under Vercel's time limit.
    for (let i = 0; i < areaList.length; i++) {
      const area = areaList[i];
      setProgress(`Searching ${area.replace(", MN", "")} (${i + 1} of ${areaList.length})…`);
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          body: JSON.stringify({ category, area, maxRating, minReviews, pages }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        total += data.scanned;
        (data.existing as string[]).forEach((id) => seenExisting.add(id));
        for (const c of data.candidates as Candidate[]) if (!byId.has(c.place_id)) byId.set(c.place_id, { ...c, area });
        const merged = [...byId.values()].sort((a, b) => b.score - a.score);
        setRows(merged);
        setScanned(total);
        setExisting(new Set(seenExisting));
        setSelected(new Set(merged.filter((c) => !seenExisting.has(c.place_id)).map((c) => c.place_id)));
      } catch (e) {
        errs.push(`${area}: ${(e as Error).message}`);
        setErrors([...errs]);
      }
    }
    setProgress("");
    setBusy(false);
  }

  async function save() {
    if (!rows) return;
    const picks = rows.filter((c) => selected.has(c.place_id));
    setBusy(true);
    let saved = 0;
    try {
      for (let i = 0; i < picks.length; i += 100) {
        const res = await fetch("/api/leads/import", { method: "POST", body: JSON.stringify({ candidates: picks.slice(i, i + 100) }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        saved += data.saved;
      }
      setSaveMsg(`Saved ${saved} leads to your pipeline.`);
      setExisting((s) => new Set([...s, ...picks.map((p) => p.place_id)]));
      setSelected(new Set());
    } catch (e) {
      setSaveMsg(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
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
    rows?.forEach((c) => c.pain_points.forEach((p) => m.set(p.offer, (m.get(p.offer) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const isPreset = (areasOfPreset: string[]) => areasOfPreset.length === areas.size && areasOfPreset.every((a) => areas.has(a));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find leads</h1>
        <p className="text-slate-600">Search Google for businesses with weak ratings, then read what their unhappy customers say.</p>
      </div>

      <form onSubmit={search} className="card space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="label">Business type</label>
            <select className="input" value={categoryPick} onChange={(e) => setCategoryPick(e.target.value)}>
              {CATEGORY_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.types.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </optgroup>
              ))}
              <option value={CUSTOM}>Other (type your own)…</option>
            </select>
            {categoryPick === CUSTOM && (
              <input className="input mt-2" placeholder="e.g. funeral home" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} autoFocus />
            )}
          </div>
          <div>
            <label className="label">Max rating ★</label>
            <input className="input" type="number" step="0.1" min={1} max={5} value={maxRating} onChange={(e) => setMaxRating(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Min # reviews</label>
            <input className="input" type="number" min={0} value={minReviews} onChange={(e) => setMinReviews(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">Area · {areas.size} selected</label>
          <div className="flex flex-wrap gap-2">
            {AREA_PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => setAreas(new Set(p.areas))}
                className={`rounded-full border px-3 py-1 text-sm ${isPreset(p.areas) ? "border-brand bg-brand text-white" : "border-slate-300 bg-white hover:bg-slate-100"}`}
              >
                {p.label}
                {p.areas.length > 1 && <span className="ml-1 opacity-70">({p.areas.length})</span>}
              </button>
            ))}
            <button type="button" onClick={() => setShowAreas((v) => !v)} className="rounded-full px-3 py-1 text-sm text-brand hover:underline">
              {showAreas ? "Hide cities" : "Pick cities…"}
            </button>
          </div>

          {showAreas && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {AREA_GROUPS.map((g) => {
                const allOn = g.areas.every((a) => areas.has(a));
                return (
                  <div key={g.group}>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase">{g.group}</span>
                      <button
                        type="button"
                        className="text-xs text-brand hover:underline"
                        onClick={() =>
                          setAreas((s) => {
                            const n = new Set(s);
                            g.areas.forEach((a) => (allOn ? n.delete(a) : n.add(a)));
                            return n;
                          })
                        }
                      >
                        {allOn ? "none" : "all"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {g.areas.map((a) => (
                        <label key={a} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" checked={areas.has(a)} onChange={() => toggleArea(a)} />
                          {a.replace(", MN", "")}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2 pt-1">
                <input
                  className="input max-w-xs"
                  placeholder="Add another area or ZIP (e.g. 55408)"
                  value={extraArea}
                  onChange={(e) => setExtraArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExtraArea();
                    }
                  }}
                />
                <button type="button" className="btn-ghost" onClick={addExtraArea}>Add</button>
              </div>
              {[...areas].filter((a) => !AREA_GROUPS.some((g) => g.areas.includes(a))).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[...areas]
                    .filter((a) => !AREA_GROUPS.some((g) => g.areas.includes(a)))
                    .map((a) => (
                      <span key={a} className="pill bg-white text-slate-700 ring-1 ring-slate-300">
                        {a}
                        <button type="button" className="ml-1 text-slate-400 hover:text-hot" onClick={() => toggleArea(a)}>✕</button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn" disabled={busy}>{busy ? "Searching…" : `Search ${areas.size} area${areas.size === 1 ? "" : "s"}`}</button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Depth per area
            <select className="input w-auto" value={pages} onChange={(e) => setPages(Number(e.target.value))}>
              <option value={1}>20 results</option>
              <option value={2}>40 results</option>
              <option value={3}>60 results (max)</option>
            </select>
          </label>
          {areas.size > 8 && (
            <span className="text-xs text-amber-700">Heads up: {areas.size} areas = {areas.size} Google searches. Takes a few minutes and uses more of your Google budget.</span>
          )}
        </div>
      </form>

      {progress && <div className="card flex items-center gap-3 text-sm text-slate-600"><span className="h-3 w-3 animate-pulse rounded-full bg-brand" />{progress}</div>}
      {errors.length > 0 && (
        <div className="card border-red-200 bg-red-50 text-sm text-hot">
          {errors.map((e) => <div key={e}>{e}</div>)}
        </div>
      )}

      {rows && (rows.length > 0 || !busy) && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Scanned <b>{scanned}</b> businesses → <b>{rows.length}</b> at or below {maxRating}★ with {minReviews}+ reviews.
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
            {rows.map((c) => {
              const saved = existing.has(c.place_id);
              return (
                <div key={c.place_id} className={`card flex gap-4 ${saved ? "opacity-60" : ""}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={selected.has(c.place_id)} onChange={() => toggle(c.place_id)} disabled={saved} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <span className="pill bg-amber-100 text-amber-800">★ {c.rating?.toFixed(1)} ({c.review_count})</span>
                      <ScorePill score={c.score} />
                      <span className="pill bg-slate-100 text-slate-600">{c.city ?? c.area.replace(", MN", "")}</span>
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
                    {c.review_snippets[0] && <p className="line-clamp-2 text-sm text-slate-600 italic">&ldquo;{c.review_snippets[0].text}&rdquo;</p>}
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
