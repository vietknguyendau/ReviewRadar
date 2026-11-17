/**
 * Google Places API (New) client.
 * Two-step to control cost: Text Search (cheap-ish, returns rating + count) → filter →
 * Place Details with reviews only for businesses that pass the low-rating filter.
 */
import { detectPainPoints, opportunityScore, type DetectedPain } from "./painpoints";

const BASE = "https://places.googleapis.com/v1";

const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.businessStatus",
  "nextPageToken",
].join(",");

const DETAIL_FIELDS = "id,rating,userRatingCount,reviews";

type GPlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryTypeDisplayName?: { text: string };
  businessStatus?: string;
  reviews?: { rating: number; text?: { text: string }; originalText?: { text: string }; relativePublishTimeDescription?: string }[];
};

export type Candidate = {
  place_id: string;
  name: string;
  category: string | null;
  search_query: string;
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
  pain_points: DetectedPain[];
  review_snippets: { rating: number; text: string; when?: string }[];
  score: number;
};

function key() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) throw new Error("GOOGLE_PLACES_API_KEY is not set (see README).");
  return k;
}

async function gfetch<T>(url: string, init: RequestInit, fieldMask: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key(), "X-Goog-FieldMask": fieldMask, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places error ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

function component(p: GPlace, type: string) {
  return p.addressComponents?.find((c) => c.types.includes(type))?.longText ?? null;
}

export async function textSearch(query: string, maxPages = 3): Promise<GPlace[]> {
  const out: GPlace[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const data = await gfetch<{ places?: GPlace[]; nextPageToken?: string }>(
      `${BASE}/places:searchText`,
      { method: "POST", body: JSON.stringify({ textQuery: query, pageSize: 20, ...(pageToken ? { pageToken } : {}) }) },
      SEARCH_FIELDS,
    );
    out.push(...(data.places ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return out;
}

export async function placeDetails(placeId: string): Promise<GPlace> {
  return gfetch<GPlace>(`${BASE}/places/${encodeURIComponent(placeId)}`, { method: "GET" }, DETAIL_FIELDS);
}

export function toCandidate(p: GPlace, query: string, reviews: GPlace["reviews"] = []): Candidate {
  const snippets = (reviews ?? [])
    .map((r) => ({ rating: r.rating, text: (r.originalText?.text ?? r.text?.text ?? "").trim(), when: r.relativePublishTimeDescription }))
    .filter((r) => r.text);
  const pains = detectPainPoints(snippets);
  return {
    place_id: p.id,
    name: p.displayName?.text ?? "Unknown",
    category: p.primaryTypeDisplayName?.text ?? null,
    search_query: query,
    address: p.formattedAddress ?? null,
    city: component(p, "locality"),
    zip: component(p, "postal_code"),
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    maps_url: p.googleMapsUri ?? null,
    rating: p.rating ?? null,
    review_count: p.userRatingCount ?? null,
    pain_points: pains,
    review_snippets: snippets.filter((s) => s.rating <= 3).slice(0, 5),
    score: opportunityScore({
      rating: p.rating ?? null,
      reviewCount: p.userRatingCount ?? null,
      pains,
      hasPhone: !!p.nationalPhoneNumber,
      hasWebsite: !!p.websiteUri,
    }),
  };
}

/** Run a full discovery: search → filter low ratings → fetch reviews → score. */
export async function discover(opts: {
  category: string;
  area: string;
  maxRating: number;
  minReviews: number;
  maxPages?: number;
}): Promise<{ candidates: Candidate[]; scanned: number }> {
  const query = `${opts.category} in ${opts.area}`;
  const places = await textSearch(query, opts.maxPages ?? 3);
  const filtered = places.filter(
    (p) =>
      (p.businessStatus ?? "OPERATIONAL") === "OPERATIONAL" &&
      typeof p.rating === "number" &&
      p.rating <= opts.maxRating &&
      (p.userRatingCount ?? 0) >= opts.minReviews,
  );

  // Fetch reviews with small concurrency to stay polite with quotas.
  const results: Candidate[] = [];
  const queue = [...filtered];
  async function worker() {
    while (queue.length) {
      const p = queue.shift()!;
      try {
        const d = await placeDetails(p.id);
        results.push(toCandidate(p, query, d.reviews));
      } catch {
        results.push(toCandidate(p, query, []));
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  results.sort((a, b) => b.score - a.score);
  return { candidates: results, scanned: places.length };
}
