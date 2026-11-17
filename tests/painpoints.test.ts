import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPainPoints, opportunityScore } from "../src/lib/painpoints.ts";

test("detects phone + follow-up pain from negative reviews", () => {
  const pains = detectPainPoints([
    { rating: 1, text: "Called 5 times and nobody answered. Went straight to voicemail every time." },
    { rating: 2, text: "Left multiple messages and they never called me back. Still waiting for a quote." },
    { rating: 5, text: "Nobody answered but whatever, great work" }, // positive reviews are ignored
  ]);
  const keys = pains.map((p) => p.key);
  assert.ok(keys.includes("missed_calls"));
  assert.ok(keys.includes("slow_response"));
  assert.equal(pains.find((p) => p.key === "missed_calls")!.count, 1);
});

test("detects scheduling, wait, billing, attitude", () => {
  const keys = detectPainPoints([
    { rating: 1, text: "They double booked us and then cancelled my appointment." },
    { rating: 2, text: "Waited over an hour past our time." },
    { rating: 1, text: "Hidden fees everywhere and they overcharged me." },
    { rating: 1, text: "The front desk was so rude." },
  ]).map((p) => p.key);
  for (const k of ["scheduling", "wait_times", "billing", "staff_attitude"]) assert.ok(keys.includes(k), k);
});

test("score rewards low rating, volume and fixable pain", () => {
  const strong = opportunityScore({
    rating: 2.8,
    reviewCount: 220,
    pains: [
      { key: "missed_calls", label: "", offer: "", count: 3, examples: [] },
      { key: "slow_response", label: "", offer: "", count: 2, examples: [] },
    ],
    hasPhone: true,
    hasWebsite: false,
  });
  const weak = opportunityScore({ rating: 4.4, reviewCount: 4, pains: [], hasPhone: true, hasWebsite: true });
  assert.ok(strong >= 75, `strong=${strong}`);
  assert.ok(weak <= 25, `weak=${weak}`);
  assert.ok(strong <= 100);
});
