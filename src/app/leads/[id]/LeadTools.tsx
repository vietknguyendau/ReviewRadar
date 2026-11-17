"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadTools({ leadId, initialScript, aiEnabled }: { leadId: number; initialScript: string | null; aiEnabled: boolean }) {
  const router = useRouter();
  const [script, setScript] = useState(initialScript);
  const [busy, setBusy] = useState<"" | "ai" | "refresh">("");
  const [err, setErr] = useState("");

  async function call(kind: "ai" | "refresh") {
    setBusy(kind);
    setErr("");
    const res = await fetch(`/api/leads/${leadId}/${kind === "ai" ? "ai-script" : "refresh"}`, { method: "POST" });
    const data = await res.json();
    setBusy("");
    if (!res.ok) return setErr(data.error);
    if (kind === "ai") setScript(data.script);
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => call("ai")} disabled={!aiEnabled || !!busy} title={aiEnabled ? "" : "Add ANTHROPIC_API_KEY to enable"}>
          {busy === "ai" ? "Writing…" : "✨ Personalize with Claude"}
        </button>
        <button className="btn-ghost" onClick={() => call("refresh")} disabled={!!busy}>
          {busy === "refresh" ? "Refreshing…" : "↻ Refresh from Google"}
        </button>
        <button className="btn-ghost" onClick={() => window.print()}>🖨 Print leave-behind</button>
      </div>
      {err && <p className="text-sm text-hot">{err}</p>}
      {script && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <div className="label">Claude&apos;s personalized script</div>
          <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{script}</pre>
        </div>
      )}
    </div>
  );
}
