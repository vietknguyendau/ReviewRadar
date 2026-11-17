"use client";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card max-w-xl space-y-3">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-slate-600">
        This is usually setup — the database isn&apos;t connected or tables haven&apos;t been created yet.
      </p>
      {error.digest && <p className="text-xs text-slate-400">Error ref: {error.digest} (see Vercel → Logs)</p>}
      <div className="flex gap-2">
        <Link href="/setup" className="btn">Check setup</Link>
        <button className="btn-ghost" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
