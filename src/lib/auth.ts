export const AUTH_COOKIE = "rr_auth";

/** Cookie value = SHA-256(APP_PASSWORD). Works in both edge and node runtimes. */
export async function passwordToken(password: string) {
  const data = new TextEncoder().encode(`review-radar:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
