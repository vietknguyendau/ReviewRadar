# Review Radar

Prospecting tool for an AI solutions consultancy. It finds local businesses with weak Google ratings, reads their negative reviews, turns the complaints into specific AI fixes you can pitch, and tracks every cold call and door knock in a simple pipeline.

## What it does

| Page | What you get |
|---|---|
| **Find leads** | Search any business type + area (e.g. "HVAC contractor in Minneapolis, MN"). It keeps only businesses at or below your rating cutoff (default 3.9★) with enough reviews to be established (default 10+), then pulls their reviews. |
| **Pain-point engine** | Reads 1–3★ reviews for patterns such as unanswered phones, no call-backs, booking problems, long waits, poor communication, billing confusion and rude staff. Each pattern maps to an offer (AI receptionist, instant follow-up, AI scheduling, and so on). |
| **Opportunity score (0–100)** | Combines rating gap, review volume (a proxy for an established business with a visible problem), AI-fixable pain found in reviews, and gaps like no website. |
| **Pipeline** | Filter by stage, city/ZIP or score; bulk-move stages; export CSV. |
| **Door-knock routes** | Select leads → **Plan door-knock route** orders them nearest-next and opens turn-by-turn Google Maps links (10 stops per leg). |
| **Lead page** | Tap-to-call, the complaints with quotes, a ready cold-call script, a 30-sec door-knock script with a leave-behind, a voicemail and a follow-up email, all filled in with that business's data. Optional **Personalize with Claude**. |
| **Log a touch** | Call, door knock, voicemail, email or meeting, plus an outcome. The stage advances automatically (e.g. "Meeting set" → Meeting set; "Asked not to be contacted" → Do not contact). |
| **Dashboard** | Calls and knocks this week, meetings, wins, follow-ups due, and the hottest untouched leads. |

## Deploy (about 20 minutes, no coding)

### 1. Put the code on GitHub
1. Create a new **private** repo at <https://github.com/new>, e.g. `review-radar`.
2. Upload: unzip this project, then either drag the files into GitHub's "uploading an existing file" page, or from a terminal:
   ```bash
   cd review-radar
   git init && git add . && git commit -m "Review Radar v1"
   git branch -M main
   git remote add origin https://github.com/<you>/review-radar.git
   git push -u origin main
   ```

### 2. Get a Google Places API key
1. <https://console.cloud.google.com> → create a project → **Billing** (Google requires a card on file).
2. **APIs & Services → Library →** enable **Places API (New)**.
3. **Credentials → Create credentials → API key**. Restrict it to *Places API (New)*.
4. **Set a budget alert** (Billing → Budgets) so a heavy search day can't surprise you.

> Cost: a full search (60 businesses scanned, plus details and reviews for the low-rated ones) is roughly a few cents to about $1 depending on how many pass the filter. Check Google's current Places pricing and free monthly usage credits.

### 3. Deploy on Vercel
1. <https://vercel.com/new> → **Import** your GitHub repo → Deploy. The first deploy works before any keys are set.
2. **Storage → Create Database → Neon (Postgres)** → connect it to the project. This sets `DATABASE_URL` for you.
3. **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GOOGLE_PLACES_API_KEY` | from step 2 |
   | `APP_PASSWORD` | a strong password; your lead list should not be public |
   | `NEXT_PUBLIC_AGENCY_NAME` | your consultancy's name |
   | `NEXT_PUBLIC_REP_NAME` | e.g. `Viet` |
   | `NEXT_PUBLIC_REP_PHONE` | your callback number |
   | `NEXT_PUBLIC_DEFAULT_CITY` | `Minneapolis, MN` |
   | `ANTHROPIC_API_KEY` *(optional)* | for Claude-personalized scripts |

4. **Deployments → Redeploy** so the variables take effect.
5. Open the site → **Setup** → **Create / update tables**. Done.

Every `git push` to `main` now auto-deploys.

## Run locally
```bash
cp .env.example .env.local   # fill in values (DATABASE_URL can point at the same Neon DB)
npm install
npm run dev                  # http://localhost:3000
npm test                     # pain-point + scoring tests
```

## Playbook: how to use it each week
1. **Monday: build lists.** Run 3–5 searches by niche + suburb (Minneapolis, St. Paul, Edina, Bloomington, Maple Grove…). Searching by suburb gets past Google's 60-result cap. Save everything scoring 50+.
2. **Tue–Thu mornings: call block.** Sort Pipeline by *Best opportunity*, filter stage = New. Call, log each touch, and let follow-up dates set themselves.
3. **Tue–Thu, 2–4 pm: door knocks.** Filter by city/ZIP, select 8–10 leads, **Plan door-knock route**, and print each lead's leave-behind first. A one-page "here's what your customers are saying + 3 fixes" sheet is what gets you in the door.
4. **Friday: follow-ups.** Work the Dashboard's *Follow-ups due* list; send the follow-up email to everyone who said "send me info."

Niches that tend to have the most AI-fixable complaints (missed calls, slow call-backs, booking): home services (HVAC, plumbing, roofing), dental/chiro/med spa, auto repair, property and HOA management, and moving companies.

## Compliance notes (not legal advice)
- **Calling:** dial by hand. Calls to business landlines are generally outside the National Do Not Call Registry, but autodialers, prerecorded messages or texts to **cell phones** fall under the TCPA, and many small-business numbers are owners' cell phones. Respect every "don't call again": log the outcome **Asked not to be contacted**, which hides the lead from the default view.
- **Email:** follow CAN-SPAM (accurate sender, physical address, honor opt-outs).
- **Door-to-door:** commercial walk-ins are usually fine. Check Minneapolis and suburban solicitor or peddler rules if you ever canvass residential areas.
- **Google data:** the Places API terms limit storing Google content long-term (place IDs can be kept). The app tracks `refreshed_at`, flags leads with data over 25 days old, and has a **Refresh from Google** button. Refresh before outreach and avoid reselling or republishing the data.

## Tuning
- Complaint patterns and offers: `src/lib/painpoints.ts` (`PAIN_RULES`). Add patterns, re-run `npm test`.
- Scoring weights: `opportunityScore()` in the same file.
- Script wording: `src/lib/scripts.ts`.
- Business type presets: `src/lib/categories.ts`.

## Stack
Next.js 16 (App Router, server actions) · Tailwind CSS 4 · Neon serverless Postgres · Google Places API (New) · optional Claude API · Vercel.

Limitation: Google returns at most 5 reviews per business (its "most relevant," not necessarily the newest), so pain-point detection is a strong signal, not a full audit. Open the lead on Google Maps for the full picture before a meeting.
