/**
 * VUREX Auth-UI: eine gemeinsame Sprache für Video-Hintergrund, unteres Sheet,
 * Modal (E-Mail), Buttons und Splash — damit alles aus einem Guss wirkt.
 */

// ——— Basis ———
export const AUTH_ROOT_BG = "#0a0a0c";
/** Leicht aufgehellt für Boot-Verlauf (gleiche Familie wie Root) */
export const AUTH_SPLASH_TOP = "#15161d";

// ——— Video S/W ———
export const AUTH_VIDEO_DESAT_GRAY = "#808080";

export const AUTH_VIDEO_OVERLAY = [
  "rgba(48,48,48,0.50)",
  "rgba(32,32,32,0.68)",
  "rgba(16,16,16,0.88)",
];

export const AUTH_VIDEO_SHEEN = [
  "rgba(210,210,210,0.10)",
  "rgba(180,180,180,0.04)",
  "rgba(0,0,0,0)",
];

export const AUTH_VIDEO_VIGNETTE = [
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.38)",
  "rgba(0,0,0,0.62)",
];

// ——— Login/Register unteres Panel + Formular ———
/** Gleiche „Slate“-Familie wie Buttons, leicht transparenter Überzug */
export const AUTH_FORM_SCRIM = "rgba(20,21,26,0.94)";
/** Unteres Panel auf Video-Hintergrund — bewusst niedrige Alpha, damit die Karte/Video klar durchscheint */
export const AUTH_FORM_SCRIM_GLASS = "rgba(6,7,10,0.28)";

export const AUTH_BTN_PRIMARY = "#2a2b36";
export const AUTH_BTN_EMAIL = "#22232c";

// ——— Gemeinsame Maße & Kanten (Screens + E-Mail-Sheet) ———
export const UI_RADIUS_LG = 22;
export const UI_RADIUS_MD = 12;
export const UI_PAGE_GUTTER = 22;

export const UI_BORDER_SUBTLE = "rgba(255,255,255,0.22)";
export const UI_BORDER_INPUT = "rgba(255,255,255,0.26)";
export const UI_BORDER_BTN = "rgba(255,255,255,0.24)";
export const UI_DIVIDER_LINE = "rgba(255,255,255,0.2)";

export const UI_INPUT_FILL = "rgba(255,255,255,0.09)";

// ——— Modal / Bottom-Sheet (E-Mail) ———
export const AUTH_MODAL_DIM = "rgba(10,11,14,0.52)";
/** Oberfläche zwischen Primary-Button und altem Sheet-Violett — ein Block mit dem unteren Panel */
export const AUTH_SHEET_SURFACE = "#32333d";
export const AUTH_SHEET_BORDER = UI_BORDER_SUBTLE;
export const AUTH_SHEET_SHEEN = [
  "rgba(220,220,225,0.09)",
  "rgba(180,180,188,0.035)",
  "transparent",
];

// ——— Gemeinsames Auth-Screen-Layout (Login, Register, Footer) ———

/** Abstand Hero-Text zum Footer-Panel, wenn Footer-Höhe bekannt */
export const AUTH_HERO_FOOTER_GAP = 6;

/** Kleiner Zusatz über dem System-Inset am unteren Rand */
export function getAuthFooterInnerPad(winH) {
  return Math.max(10, Math.min(20, Math.round(winH * 0.022)));
}

/** Max. Höhe des scrollbaren Footer-Inhalts (kleine Geräte) */
export function getAuthSheetScrollMaxHeight(winH, insets) {
  const safeH = Math.max(300, winH - insets.top - insets.bottom);
  return Math.round(Math.min(safeH * 0.62, Math.max(safeH * 0.48, 220)));
}

export function getAuthFooterPaddingBottom(winH, insets) {
  return insets.bottom + getAuthFooterInnerPad(winH);
}

/**
 * Native-Stack mit dunklem Auth-Hintergrund (z. B. AGB/Datenschutz aus dem Auth-Flow).
 */
export const stackScreenAuth = {
  headerStyle: { backgroundColor: AUTH_ROOT_BG },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: AUTH_ROOT_BG },
};
