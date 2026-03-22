import { API_BASE_URL } from "../config";

/**
 * URI für Profilbilder: data-URLs, http(s) und Pfade relativ zur API (z. B. /uploads/…).
 */
export function resolveUserAvatarUri(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== "string") {
    return null;
  }
  const s = avatarUrl.trim();
  if (!s) {
    return null;
  }
  if (s.startsWith("data:")) {
    return s;
  }
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  if (s.startsWith("/")) {
    const base = String(API_BASE_URL || "").replace(/\/$/, "");
    return base ? `${base}${s}` : null;
  }
  return null;
}
