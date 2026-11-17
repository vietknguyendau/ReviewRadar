"use client";
import { useState } from "react";

export default function SetupButton({ disabled }: { disabled: boolean }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const res = await fetch("/api/setup", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? `Done — ${data.statements} statements applied. Head to Find leads.` : `Error: ${data.error}`);
  }
  return (
    <div className="space-y-2">
      <button className="btn" onClick={run} disabled={disabled || busy}>{busy ? "Running…" : "Create / update tables"}</button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
