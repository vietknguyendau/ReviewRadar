/**
 * Turns review text into AI-solvable pain points and a matching offer to pitch.
 * Pure functions (no imports) so they're easy to unit test and tune.
 */

export type PainRule = {
  key: string;
  label: string;
  offer: string;
  pitch: string; // one-line value statement used in scripts
  patterns: RegExp[];
  aiFixable: boolean;
};

export const PAIN_RULES: PainRule[] = [
  {
    key: "missed_calls",
    label: "Phones not answered",
    offer: "AI Receptionist (24/7 voice agent)",
    pitch: "an AI receptionist that answers every call 24/7, books appointments and texts you the details",
    aiFixable: true,
    patterns: [
      /never (pick(ed)? up|answer(ed|s)?)/i,
      /(no one|nobody|didn'?t|doesn'?t|don'?t|won'?t) (ever )?(answer|pick up)/i,
      /(couldn'?t|can'?t|could not|cannot) (get through|reach|get a hold|get ahold)/i,
      /(went|goes|go) (straight )?to voicemail/i,
      /voicemail (is |was )?full/i,
      /on hold (for )?\d+/i,
      /(kept|left) (me )?on hold/i,
      /phone (just )?rang/i,
    ],
  },
  {
    key: "slow_response",
    label: "Slow or no follow-up",
    offer: "Instant lead response + automated follow-up",
    pitch: "automatic text and email follow-up so every inquiry gets a reply in under a minute",
    aiFixable: true,
    patterns: [
      /never (called|call|got|get|emailed|texted|wrote) (me )?back/i,
      /never heard (back|from)/i,
      /(no|zero) (response|reply|follow[- ]?up|call ?back)/i,
      /(didn'?t|did not|don'?t|won'?t) (respond|reply|return|follow)/i,
      /(still )?waiting (for|on) (a |an )?(call|response|reply|quote|estimate|update)/i,
      /ghost(ed)?/i,
      /left (multiple|several|many|\d+) (messages|voicemails)/i,
    ],
  },
  {
    key: "scheduling",
    label: "Scheduling & booking problems",
    offer: "AI scheduling assistant + online booking",
    pitch: "self-serve online booking with automatic reminders that cut no-shows and double-bookings",
    aiFixable: true,
    patterns: [
      /(double|over)[- ]?book/i,
      /(cancel+ed|resched\w*) (my|the|our) (appointment|appt|reservation|service)/i,
      /(appointment|appt|reservation) (was |got )?(cancel+ed|lost|missed|forgot)/i,
      /(no|didn'?t|never) (show|showed|show up|showed up)/i,
      /(forgot|lost) (my|our|the) (appointment|reservation|booking)/i,
      /(hard|impossible|difficult) to (book|schedule|get an appointment)/i,
      /(weeks|months) (out|to get (in|an appointment))/i,
    ],
  },
  {
    key: "wait_times",
    label: "Long wait times",
    offer: "Text-when-ready queueing + AI demand forecasting",
    pitch: "a text-when-ready queue and staffing forecasts so customers aren't stuck waiting",
    aiFixable: true,
    patterns: [
      /wait(ed|ing)? (for )?(over |more than |almost |nearly )?(an? |\d+ |two |three )?(hour|hours|hr|min|minutes)/i,
      /(took|takes) (forever|so long|over an hour)/i,
      /(long|ridiculous|terrible|horrible) wait/i,
      /wait (time|times) (is|are|was|were)/i,
    ],
  },
  {
    key: "communication",
    label: "Poor communication / no updates",
    offer: "Automated status updates + AI customer assistant",
    pitch: "automatic status updates so customers always know where things stand without calling you",
    aiFixable: true,
    patterns: [
      /(no|zero|lack of|poor|terrible|horrible|bad) communicat/i,
      /(no|never (got|gave|received) (an? )?)updates?/i,
      /kept (me |us )?in the dark/i,
      /(nobody|no one) (knew|knows|could tell)/i,
      /(miscommunicat|mix[- ]?up|wrong order|got (my|the) order wrong)/i,
      /(had|have) to (keep )?(call|chase|follow up)/i,
    ],
  },
  {
    key: "billing",
    label: "Billing, quotes & pricing confusion",
    offer: "Automated quoting + transparent billing messages",
    pitch: "fast, consistent quotes and clear billing messages that stop surprise-charge complaints",
    aiFixable: true,
    patterns: [
      /over ?charg/i,
      /(hidden|surprise|extra|junk) (fee|fees|charge|charges)/i,
      /(charged|billed) (me |us )?(twice|double|more than|for something)/i,
      /(quote|estimate) (was |never |took)/i,
      /(never|didn'?t) (got|get|receive|send|sent) (a |an |the |my )?(quote|estimate|invoice|refund)/i,
      /(refund|billing) (issue|problem|nightmare)/i,
    ],
  },
  {
    key: "staff_attitude",
    label: "Rude or unhelpful staff",
    offer: "AI call/QA coaching + review response system",
    pitch: "call-quality scoring and coaching so every customer gets the same great experience",
    aiFixable: false,
    patterns: [/\brude\b/i, /attitude/i, /unprofessional/i, /(unfriendly|condescending|dismissive|disrespectful)/i],
  },
];

export const BASELINE_OFFER = {
  key: "reputation",
  label: "Low rating / reputation",
  offer: "AI review response + review generation",
  pitch: "an AI system that replies to every review within hours and asks happy customers to leave one",
};

export type DetectedPain = {
  key: string;
  label: string;
  offer: string;
  count: number;
  examples: string[];
};

function excerpt(text: string, match: RegExpMatchArray): string {
  const i = match.index ?? 0;
  const start = Math.max(0, i - 60);
  const end = Math.min(text.length, i + match[0].length + 60);
  return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
}

/** Analyze review texts; only negative/mixed reviews (<=3 stars) are counted when ratings are supplied. */
export function detectPainPoints(reviews: { text: string; rating?: number }[]): DetectedPain[] {
  const found = new Map<string, DetectedPain>();
  for (const r of reviews) {
    if (!r.text) continue;
    if (typeof r.rating === "number" && r.rating > 3) continue;
    for (const rule of PAIN_RULES) {
      for (const p of rule.patterns) {
        const m = r.text.match(p);
        if (m) {
          const cur = found.get(rule.key) ?? { key: rule.key, label: rule.label, offer: rule.offer, count: 0, examples: [] };
          cur.count += 1;
          if (cur.examples.length < 2) cur.examples.push(excerpt(r.text, m));
          found.set(rule.key, cur);
          break; // one hit per rule per review
        }
      }
    }
  }
  return [...found.values()].sort((a, b) => b.count - a.count);
}

export function ruleFor(key: string) {
  return PAIN_RULES.find((r) => r.key === key);
}

/**
 * Opportunity score 0–100. Higher = better prospect.
 * - rating gap (40): lower rating = more pain to solve
 * - review volume (20): more reviews = established business with budget + visible problem
 * - AI-fixable pain points (25): evidence in reviews of problems your services fix
 * - reachability/gaps (15): has phone, no website (extra offer), operating
 */
export function opportunityScore(input: {
  rating: number | null;
  reviewCount: number | null;
  pains: DetectedPain[];
  hasPhone: boolean;
  hasWebsite: boolean;
}): number {
  const rating = input.rating ?? 4.5;
  const ratingPts = Math.min(1, Math.max(0, (4.6 - rating) / 2.6)) * 40;
  const count = Math.max(0, input.reviewCount ?? 0);
  const volumePts = Math.min(1, Math.log10(count + 1) / Math.log10(400)) * 20;
  const fixable = input.pains.filter((p) => ruleFor(p.key)?.aiFixable);
  const painPts = Math.min(1, (fixable.length + Math.min(2, fixable.reduce((s, p) => s + p.count, 0) / 3)) / 4) * 25;
  const reachPts = (input.hasPhone ? 8 : 0) + (input.hasWebsite ? 0 : 7);
  return Math.round(ratingPts + volumePts + painPts + reachPts);
}
