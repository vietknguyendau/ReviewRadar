/**
 * Outreach scripts built from each lead's real data. Tone rule: never shame the owner
 * over their reviews — lead with empathy, name the pattern, offer a specific fix.
 */
import { BASELINE_OFFER, ruleFor } from "./painpoints";
import type { Lead } from "./constants";

export type ScriptSet = { title: string; body: string }[];

const agency = () => process.env.NEXT_PUBLIC_AGENCY_NAME || "our AI consultancy";
const rep = () => process.env.NEXT_PUBLIC_REP_NAME || "[Your name]";
const repPhone = () => process.env.NEXT_PUBLIC_REP_PHONE || "[your number]";

function topPain(lead: Lead) {
  const p = lead.pain_points.find((x) => ruleFor(x.key)?.aiFixable) ?? lead.pain_points[0];
  const rule = p ? ruleFor(p.key) : undefined;
  return {
    label: p?.label?.toLowerCase() ?? BASELINE_OFFER.label.toLowerCase(),
    pitch: rule?.pitch ?? BASELINE_OFFER.pitch,
    offer: p?.offer ?? BASELINE_OFFER.offer,
    count: p?.count ?? 0,
  };
}

function biz(lead: Lead) {
  return lead.category ? lead.category.toLowerCase() : "business";
}

export function buildScripts(lead: Lead): ScriptSet {
  const tp = topPain(lead);
  const ratingLine =
    lead.rating != null ? `${lead.rating.toFixed(1)} stars across ${lead.review_count ?? 0} Google reviews` : "your Google reviews";
  const patternLine =
    tp.count > 0
      ? `a lot of the frustrated reviews mention ${tp.label} — which is usually a systems problem, not a people problem`
      : `the reviews don't match the effort it takes to run a ${biz(lead)}`;

  return [
    {
      title: "Cold call (60–90 sec)",
      body: `OPENER
"Hi, is this the owner or manager? … Great — this is ${rep()} with ${agency()}, a local AI consulting firm here in town. I'll be honest, this is a cold call — can I take 30 seconds to tell you why I called, and you can tell me if it's worth a conversation?"

WHY YOU CALLED
"I work with ${biz(lead)}s on the stuff that drags down reviews. I was looking at ${lead.name} — you're at ${ratingLine}, and ${patternLine}."

VALUE
"We set up ${tp.pitch}. Most owners I talk to are already stretched thin — this takes work off your team, it doesn't add to it."

QUESTION (let them talk)
"Out of curiosity — is ${tp.label} something you're already aware of, or is it more of a staffing thing on your end?"

ASK
"I'd love 15 minutes to show you what this looks like for a ${biz(lead)} — no cost, no obligation. Would later this week or early next week work better?"

IF "NOT INTERESTED"
"Totally fair. Can I send a one-page breakdown of what I found in your reviews? If it's not useful, toss it." (Get email → log outcome.)

IF "SEND ME INFO"
"Happy to. What's the best email — and would it be crazy to put 15 minutes on the calendar so I can walk you through it?"`,
    },
    {
      title: "Door knock (30-second walk-in)",
      body: `Best times: mid-morning (10–11:30) or mid-afternoon (2–4). Avoid lunch/dinner rush. Ask for the owner or manager; if they're out, get their name + best time to come back.

"Hi! I'm ${rep()} — I run ${agency()}, a local AI consulting shop. I'm not here to sell you anything today. I help ${biz(lead)}s fix ${tp.label} — things like ${tp.pitch}.

I put together a quick one-pager on what customers are saying about ${lead.name} online and three fixes that don't need more staff. Could I leave it with you, or is the owner around for two minutes?"

LEAVE-BEHIND (print on one page)
• What we noticed: ${ratingLine}; top theme: ${tp.label}
• Fix #1: ${tp.offer}
• Fix #2: ${BASELINE_OFFER.offer}
• Fix #3: Monthly review & reputation report
• ${rep()} · ${repPhone()} · Free 15-minute review audit`,
    },
    {
      title: "Voicemail (under 25 sec)",
      body: `"Hi, this is ${rep()} with ${agency()}. I was looking at ${lead.name}'s Google reviews and noticed a pattern around ${tp.label} that's usually an easy fix with the right system. I put together a few ideas — give me a call at ${repPhone()}. Again, ${rep()}, ${repPhone()}. Thanks!"`,
    },
    {
      title: "Follow-up email",
      body: `Subject: Quick idea for ${lead.name}'s reviews

Hi [Name],

${rep()} here from ${agency()} — [we spoke / I stopped by] [day].

I read through ${lead.name}'s recent Google reviews. You're at ${ratingLine}, and the theme that stands out is ${tp.label}. The good news: that's one of the most fixable problems with today's tools.

What I'd suggest:
1. ${tp.offer}
2. ${BASELINE_OFFER.offer}
3. A simple monthly report so you can see the change

Would you be open to a 15-minute call this week? I'll bring specifics for your business, no pitch deck.

${rep()}
${agency()} · ${repPhone()}

P.S. If now isn't the right time, just reply "later" and I'll check back next quarter.`,
    },
  ];
}

/** Prompt for optional Claude-personalized scripts. */
export function aiPrompt(lead: Lead) {
  const reviews = lead.review_snippets.map((r) => `- (${r.rating}★) ${r.text}`).join("\n") || "(no review text available)";
  const pains = lead.pain_points.map((p) => `- ${p.label} (${p.count}x) → ${p.offer}`).join("\n") || "(none detected)";
  return `You are a sales coach for ${agency()}, a local AI solutions consultancy. The rep is ${rep()}.
Write a short, respectful, personalized cold-call script AND a 30-second door-knock script for this business.
Never shame the owner about reviews; be empathetic, specific and practical. Offer one concrete AI fix tied to the reviews,
end with a low-pressure ask for a free 15-minute review audit. Plain text, under 300 words total.

Business: ${lead.name}
Category: ${lead.category ?? "unknown"}
Location: ${lead.address ?? lead.city ?? ""}
Google rating: ${lead.rating ?? "?"} from ${lead.review_count ?? "?"} reviews
Website: ${lead.website ?? "none"}
Detected pain points:
${pains}
Recent negative reviews:
${reviews}`;
}
