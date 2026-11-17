import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review Radar — AI consultancy prospecting",
  description: "Find local businesses with weak reviews, see what's hurting them, and pitch the AI fix.",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/discover", label: "Find leads" },
  { href: "/leads", label: "Pipeline" },
  { href: "/setup", label: "Setup" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs text-white">RR</span>
              Review Radar
            </Link>
            <nav className="flex gap-1 text-sm">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
