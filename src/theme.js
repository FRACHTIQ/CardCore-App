/**
 * App-Palette: warmes Off-White, Anthrazit, Akzent.
 */
/**
 * Einheitliche Maße für Haupt-App (Tabs, Listen) — horizontaler Rand wie Auth `UI_PAGE_GUTTER` (22).
 */
export const Layout = {
  screenGutter: 22,
  /** Zusätzlich zum unteren Safe-Inset: Platz für die Tab-Leiste (Zeile + Polsterung) */
  tabBarScrollExtra: 56,
};

export const Theme = {
  bg: "#F5F5F1",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E0E0DD",
  line: "rgba(26,26,26,0.1)",
  text: "#1A1A1A",
  sub: "#5C5C5C",
  muted: "#8E8E8E",
  soft: "rgba(26,26,26,0.06)",
  error: "#dc2626",
  /** Reines Weiß (Karten, Inputs) */
  white: "#FFFFFF",
  /** Text auf dunklem Primary / Hero */
  onWhite: "#FFFFFF",
  /** Flächen wie Portfolio-Card, Primary-CTA */
  heroBg: "#1A1A1A",
  heroText: "#FFFFFF",
  /** Positiv / Trend (gut lesbar auf Hell & Dunkel) */
  accentGreen: "#15803d",
  accentGold: "#c9a574",
  accentTeal: "#0d9488",
  accentViolet: "#7c6aed",
  accentSky: "#268bd2",
  tabBarBg: "#FFFFFF",
};

export const stackScreenDark = {
  headerStyle: { backgroundColor: Theme.bg },
  headerTintColor: Theme.text,
  headerTitleStyle: {
    color: Theme.text,
    fontWeight: "700",
    fontSize: 17,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Theme.bg },
};
