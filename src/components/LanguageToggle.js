import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../i18n/config";

/**
 * @param {"dark" | "light"} variant — dunkle Auth-Screens vs. helles Profil
 * @param {boolean} compact — ohne Label, für die Zeile neben dem Logo
 * @param {"chips" | "segmented"} layout — segmented = ein Schalter (DE | EN), chips = zwei Kacheln
 * @param {boolean} mono — nur Schwarz/Weiß/Grau (z. B. Login wie Splash)
 */
export function LanguageToggle({
  variant = "dark",
  compact = false,
  layout = "chips",
  mono = false,
}) {
  const { t, i18n } = useTranslation();
  const code = (i18n.language || "de").split("-")[0];
  const isDe = code === "de";
  const isEn = code === "en";

  const dark = variant === "dark";

  if (layout === "segmented" && dark) {
    const trackStyle = mono ? styles.segmentTrackMono : styles.segmentTrack;
    const activeStyle = mono ? styles.segmentCellActiveMono : styles.segmentCellActive;
    const textActive = mono ? styles.segmentTextActiveMono : styles.segmentTextActive;
    const textInactive = mono
      ? styles.segmentTextInactiveMono
      : styles.segmentTextInactive;
    return (
      <View style={styles.segmentOuter}>
        <View style={trackStyle}>
          <Pressable
            style={[styles.segmentCell, isDe ? activeStyle : null]}
            onPress={() => setAppLanguage("de")}
            accessibilityRole="button"
            accessibilityState={{ selected: isDe }}
          >
            <Text
              style={[styles.segmentText, isDe ? textActive : textInactive]}
            >
              DE
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentCell, isEn ? activeStyle : null]}
            onPress={() => setAppLanguage("en")}
            accessibilityRole="button"
            accessibilityState={{ selected: isEn }}
          >
            <Text
              style={[styles.segmentText, isEn ? textActive : textInactive]}
            >
              EN
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const wrapStyle =
    variant === "light"
      ? styles.wrapLight
      : compact
        ? styles.wrapCompact
        : styles.wrap;

  return (
    <View style={wrapStyle}>
      {compact ? null : (
        <Text style={dark ? styles.labelDark : styles.labelLight}>
          {t("profile.language")}
        </Text>
      )}
      <View style={styles.row}>
        <Pressable
          style={[
            styles.chip,
            compact ? styles.chipCompact : null,
            dark
              ? isDe
                ? styles.chipOnDark
                : styles.chipOffDark
              : isDe
                ? styles.chipOnLight
                : styles.chipOffLight,
          ]}
          onPress={() => setAppLanguage("de")}
        >
          <Text
            style={[
              styles.chipText,
              compact ? styles.chipTextCompact : null,
              dark
                ? isDe
                  ? styles.textOnDark
                  : styles.textOffDark
                : isDe
                  ? styles.textOnLight
                  : styles.textOffLight,
            ]}
          >
            {t("profile.languageDe")}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.chip,
            styles.chipAfterFirst,
            compact ? styles.chipCompact : null,
            dark
              ? isEn
                ? styles.chipOnDark
                : styles.chipOffDark
              : isEn
                ? styles.chipOnLight
                : styles.chipOffLight,
          ]}
          onPress={() => setAppLanguage("en")}
        >
          <Text
            style={[
              styles.chipText,
              compact ? styles.chipTextCompact : null,
              dark
                ? isEn
                  ? styles.textOnDark
                  : styles.textOffDark
                : isEn
                  ? styles.textOnLight
                  : styles.textOffLight,
            ]}
          >
            {t("profile.languageEn")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segmentOuter: { alignItems: "flex-end" },
  segmentTrack: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  segmentTrackMono: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 22,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  segmentCell: {
    flex: 1,
    minWidth: 48,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentCellActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentCellActiveMono: {
    backgroundColor: "#ffffff",
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  segmentTextActive: { color: "#0a0a0a" },
  segmentTextActiveMono: { color: "#000000" },
  segmentTextInactive: { color: "rgba(255,255,255,0.72)" },
  segmentTextInactiveMono: { color: "#a1a1aa" },
  wrap: { alignItems: "flex-end" },
  wrapLight: { alignItems: "flex-start" },
  wrapCompact: { alignItems: "flex-end" },
  labelDark: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  labelLight: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  chipAfterFirst: {
    marginLeft: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  chipOnDark: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  chipOffDark: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipOnLight: {
    backgroundColor: "#e0f2fe",
    borderColor: "#38bdf8",
  },
  chipOffLight: {
    backgroundColor: "#f4f4f5",
    borderColor: "#e4e4e7",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextCompact: { fontSize: 12 },
  textOnDark: { color: "#ffffff" },
  textOffDark: { color: "#a1a1aa" },
  textOnLight: { color: "#0f172a" },
  textOffLight: { color: "#71717a" },
});
