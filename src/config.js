import { Platform } from "react-native";

// Backend (Railway). Lokal: http://localhost:3000
export const API_BASE_URL = "https://cardcore-production.up.railway.app";

/**
 * Store-Links für „Jetzt aktualisieren“ (Force-Update-Modal).
 * Optional: ein gemeinsamer Fallback unter APP_UPDATE_STORE_URL.
 */
export const APP_UPDATE_STORE_URL_IOS = "";
export const APP_UPDATE_STORE_URL_ANDROID = "";
export const APP_UPDATE_STORE_URL = "";

/** iOS → APP_UPDATE_STORE_URL_IOS, Android → ANDROID, sonst Fallback. */
export function resolveStoreUpdateUrl() {
  const legacy = String(APP_UPDATE_STORE_URL || "").trim();
  const ios = String(APP_UPDATE_STORE_URL_IOS || "").trim();
  const android = String(APP_UPDATE_STORE_URL_ANDROID || "").trim();
  if (Platform.OS === "ios") {
    return ios || legacy;
  }
  if (Platform.OS === "android") {
    return android || legacy;
  }
  return legacy || ios || android;
}

export const APP_NAME = "VUREX";

/** Support & rechtliche Hinweise (mailto / Texte in der App) */
export const SUPPORT_EMAIL = "support@vurex.app";

export const PRIMARY = "#8C1D18";

export const CARD_TYPES = [
  "BASE",
  "NUMBERED",
  "AUTOGRAPH",
  "PATCH",
  "ROOKIE",
];
