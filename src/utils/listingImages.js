/**
 * Thumbnail für Listings: erstes Bild aus image_urls oder neutraler Platzhalter.
 * Alte App-Builds nutzten teils Unsplash als Platzhalter (wirkte wie echtes Listing, z. B. Auto).
 * Falsch gespeicherte Stock-URLs ignorieren wir und zeigen den neutralen Platzhalter.
 */

export const LISTING_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x840/2a2a2a/737373/png?text=VUREX";

function isLegacyStockThumbnailUrl(url) {
  const s = String(url || "").trim().toLowerCase();
  if (!s) {
    return false;
  }
  if (s.startsWith("data:")) {
    return false;
  }
  const stockHosts = [
    "unsplash.com",
    "picsum.photos",
    "pexels.com",
    "pixabay.com",
    "gettyimages.com",
    "istockphoto.com",
    "shutterstock.com",
    "depositphotos.com",
    "freepik.com",
    "123rf.com",
    "adobe.com/stock",
    "alamy.com",
  ];
  return stockHosts.some((h) => s.includes(h));
}

/** Entfernt Stock-Foto-URLs; Scan/Data-URLs bleiben. */
export function filterListingImageUrls(urls) {
  if (!Array.isArray(urls)) {
    return [];
  }
  return urls
    .map((u) => String(u || "").trim())
    .filter(Boolean)
    .filter((u) => !isLegacyStockThumbnailUrl(u));
}

export function getListingThumbnailUri(listing) {
  const urls = filterListingImageUrls(
    listing.image_urls && Array.isArray(listing.image_urls) ? listing.image_urls : []
  );
  const u = urls[0] || null;
  return u || LISTING_PLACEHOLDER_IMAGE;
}
