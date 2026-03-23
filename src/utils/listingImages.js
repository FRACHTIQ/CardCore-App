/**
 * Thumbnail für Listings: erstes Bild aus image_urls oder neutraler Platzhalter.
 * (Früher Unsplash-Motiv – wirkte wie echtes Listing, z. B. Auto.)
 */

export const LISTING_PLACEHOLDER_IMAGE =
  "https://placehold.co/600x840/2a2a2a/737373/png?text=VUREX";

export function getListingThumbnailUri(listing) {
  const u =
    listing.image_urls &&
    Array.isArray(listing.image_urls) &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;
  return u || LISTING_PLACEHOLDER_IMAGE;
}
