/** Door-knock route planning: nearest-neighbor ordering + Google Maps directions links. */
export type Stop = { id: number; name: string; lat: number; lng: number };

function dist(a: Stop, b: Stop) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function orderStops(stops: Stop[]): Stop[] {
  if (stops.length < 3) return stops;
  const remaining = [...stops];
  const out = [remaining.shift()!];
  while (remaining.length) {
    const last = out[out.length - 1];
    let best = 0;
    for (let i = 1; i < remaining.length; i++) if (dist(last, remaining[i]) < dist(last, remaining[best])) best = i;
    out.push(remaining.splice(best, 1)[0]);
  }
  return out;
}

export function totalKm(stops: Stop[]) {
  let d = 0;
  for (let i = 1; i < stops.length; i++) d += dist(stops[i - 1], stops[i]);
  return d;
}

/** Google Maps supports origin + destination + up to 9 waypoints per link, so chunk into legs of 10. */
export function mapsLinks(stops: Stop[]): string[] {
  const links: string[] = [];
  for (let i = 0; i < stops.length; i += 10) {
    const leg = stops.slice(i, i + 10);
    if (leg.length === 1) {
      links.push(`https://www.google.com/maps/search/?api=1&query=${leg[0].lat},${leg[0].lng}`);
      continue;
    }
    const ll = (s: Stop) => `${s.lat},${s.lng}`;
    const params = new URLSearchParams({
      api: "1",
      origin: ll(leg[0]),
      destination: ll(leg[leg.length - 1]),
      travelmode: "driving",
    });
    const mid = leg.slice(1, -1);
    if (mid.length) params.set("waypoints", mid.map(ll).join("|"));
    links.push(`https://www.google.com/maps/dir/?${params.toString()}`);
  }
  return links;
}
