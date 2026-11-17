import SetupButton from "./SetupButton";

export const dynamic = "force-dynamic";

function Check({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full text-xs text-white ${ok ? "bg-emerald-600" : "bg-slate-300"}`}>
        {ok ? "✓" : "–"}
      </span>
      <div>
        <div className="font-medium">{label}</div>
        {!ok && <div className="text-sm text-slate-500">{hint}</div>}
      </div>
    </li>
  );
}

export default function SetupPage() {
  const env = {
    db: !!process.env.DATABASE_URL,
    google: !!process.env.GOOGLE_PLACES_API_KEY,
    pw: !!process.env.APP_PASSWORD,
    claude: !!process.env.ANTHROPIC_API_KEY,
    brand: !!process.env.NEXT_PUBLIC_AGENCY_NAME,
  };
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Setup</h1>
      <div className="card">
        <h2 className="mb-2 font-semibold">Environment</h2>
        <ul className="divide-y divide-slate-100">
          <Check ok={env.db} label="Database connected (DATABASE_URL)" hint="Vercel → Storage → Create Database → Neon. It adds DATABASE_URL automatically; redeploy after." />
          <Check ok={env.google} label="Google Places API key (GOOGLE_PLACES_API_KEY)" hint="Google Cloud Console → enable 'Places API (New)' → create an API key → add it in Vercel → Settings → Environment Variables." />
          <Check ok={env.pw} label="App password (APP_PASSWORD)" hint="Strongly recommended — your lead list should not be public." />
          <Check ok={env.brand} label="Branding (NEXT_PUBLIC_AGENCY_NAME, NEXT_PUBLIC_REP_NAME, NEXT_PUBLIC_REP_PHONE)" hint="Used in your call and door-knock scripts." />
          <Check ok={env.claude} label="Optional: Claude API key (ANTHROPIC_API_KEY)" hint="Enables AI-personalized scripts per lead." />
        </ul>
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Create database tables</h2>
        <p className="text-sm text-slate-600">Run once after the database is connected. Safe to run again.</p>
        <SetupButton disabled={!env.db} />
      </div>
    </div>
  );
}
