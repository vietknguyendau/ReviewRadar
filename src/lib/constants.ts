/** Shared types + constants (safe to import from client components). */
export type PainPoint = {
  key: string;
  label: string;
  offer: string;
  count: number;
  examples: string[];
};

export type ReviewSnippet = { rating: number; text: string; when?: string };

export type Lead = {
  id: number;
  place_id: string;
  name: string;
  category: string | null;
  search_query: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  maps_url: string | null;
  rating: number | null;
  review_count: number | null;
  pain_points: PainPoint[];
  review_snippets: ReviewSnippet[];
  score: number;
  status: string;
  owner: string | null;
  next_follow_up: string | null;
  notes: string | null;
  ai_script: string | null;
  created_at: string;
  updated_at: string;
  refreshed_at: string;
};

export type Activity = {
  id: number;
  lead_id: number;
  type: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
};

export const STATUSES = [
  { key: "new", label: "New" },
  { key: "researching", label: "Researching" },
  { key: "contacted", label: "Contacted" },
  { key: "follow_up", label: "Follow-up" },
  { key: "meeting_set", label: "Meeting set" },
  { key: "proposal", label: "Proposal sent" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "do_not_contact", label: "Do not contact" },
] as const;

export const ACTIVITY_TYPES = [
  { key: "call", label: "Call" },
  { key: "door_knock", label: "Door knock" },
  { key: "voicemail", label: "Voicemail" },
  { key: "email", label: "Email" },
  { key: "meeting", label: "Meeting" },
  { key: "note", label: "Note" },
] as const;

export const OUTCOMES = [
  { key: "no_answer", label: "No answer" },
  { key: "gatekeeper", label: "Gatekeeper / owner not in" },
  { key: "callback", label: "Asked for callback" },
  { key: "interested", label: "Interested" },
  { key: "meeting_set", label: "Meeting set" },
  { key: "not_interested", label: "Not interested" },
  { key: "do_not_contact", label: "Asked not to be contacted" },
] as const;

export function statusLabel(key: string) {
  return STATUSES.find((s) => s.key === key)?.label ?? key;
}

/** DATE columns may arrive as a JS Date or an ISO string depending on driver — normalize to YYYY-MM-DD. */
export function ymd(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}
