import { API_BASE_URL } from "./config";

export async function api(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) {
    return null;
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/**
 * KI-Erkennung: Vorder- und Rückseite als Base64 (ohne data:-Prefix möglich).
 */
export async function getListingAnalytics(token, listingId, range = "30d") {
  return api(`/api/listings/${listingId}/analytics?range=${encodeURIComponent(range)}`, {
    token,
  });
}

export async function postOffer(token, body) {
  return api("/api/offers", { token, method: "POST", body });
}

export async function getOffers(token, role = "all", opts = {}) {
  const q = new URLSearchParams({ role: String(role) });
  if (opts.limit != null) q.set("limit", String(opts.limit));
  if (opts.offset != null) q.set("offset", String(opts.offset));
  return api(`/api/offers?${q.toString()}`, { token });
}

export async function acceptOffer(token, offerId) {
  return api(`/api/offers/${offerId}/accept`, { token, method: "POST" });
}

export async function rejectOffer(token, offerId) {
  return api(`/api/offers/${offerId}/reject`, { token, method: "POST" });
}

export async function withdrawOffer(token, offerId) {
  return api(`/api/offers/${offerId}/withdraw`, { token, method: "POST" });
}

export async function getDeals(token, opts = {}) {
  const q = new URLSearchParams();
  if (opts.limit != null) q.set("limit", String(opts.limit));
  if (opts.offset != null) q.set("offset", String(opts.offset));
  if (opts.status) q.set("status", String(opts.status));
  const qs = q.toString();
  return api(`/api/deals${qs ? `?${qs}` : ""}`, { token });
}

export async function getDeal(token, dealId) {
  return api(`/api/deals/${dealId}`, { token });
}

/** Öffentlich: letzte Bewertungen eines Verkäufers (Profil-Snippets). */
export async function getSellerReviews(sellerId, limit = 3) {
  const lid = Number(sellerId);
  if (!Number.isInteger(lid) || lid < 1) {
    throw new Error("Ungültige Verkäufer-ID.");
  }
  const lim = Math.min(Math.max(Number(limit) || 3, 1), 10);
  return api(`/api/reviews/seller/${lid}?limit=${lim}`, {});
}

export async function patchDeal(token, dealId, body) {
  return api(`/api/deals/${dealId}`, { token, method: "PATCH", body });
}

export async function analyzeCardImages({
  token,
  frontBase64,
  backBase64,
  frontMime,
  backMime,
}) {
  return api("/api/ai/analyze-card", {
    token,
    method: "POST",
    body: {
      front_base64: frontBase64,
      back_base64: backBase64,
      front_mime: frontMime || "image/jpeg",
      back_mime: backMime || "image/jpeg",
    },
  });
}
