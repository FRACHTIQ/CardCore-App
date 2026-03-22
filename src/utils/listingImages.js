/**
 * Thumbnail für Listings: erstes Bild aus image_urls oder neutraler Platzhalter.
 */

export const LISTING_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&q=80";

export function getListingThumbnailUri(listing) {
  const u =
    listing.image_urls &&
    Array.isArray(listing.image_urls) &&
    listing.image_urls[0]
      ? listing.image_urls[0]
      : null;
  return u || LISTING_PLACEHOLDER_IMAGE;
}
