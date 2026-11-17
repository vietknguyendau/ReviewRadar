"use client";
import { useState } from "react";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password: pw }) });
    setBusy(false);
    if (!res.ok) return setErr("Wrong password");
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next.startsWith("/") ? next : "/";
  }

  return (
    <div className="mx-auto mt-16 max-w-sm card">
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="input" type="password" placeholder="App password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {err && <p className="text-sm text-hot">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Checking…" : "Enter"}</button>
      </form>
    </div>
  );
}
