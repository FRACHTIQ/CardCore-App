/** Boot-Splash — Farben an Auth-Theme gekoppelt */
import { AUTH_ROOT_BG } from "./authTheme";

/** Haupt-Boot (Root): Progress + API warten mindestens so lange */
export const SPLASH_MS = 5000;

/** Kurz beim i18n-Start in App.js (kein zweites 5s-Splash direkt davor) */
export const MIN_APP_SPLASH_MS = 900;

export const SPLASH_BG = AUTH_ROOT_BG;
export const BAR_FILL = "#E8E8EA";
export const BAR_TRACK = "rgba(255,255,255,0.12)";
