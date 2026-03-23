import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";

export function SplashStyleFooter({ dark = false, compact = false }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, compact ? styles.wrapCompact : null]}>
      <View style={[styles.decor, dark ? styles.decorDark : null]} />
      <Text style={styles.line}>
        <Text style={[styles.muted, dark ? styles.mutedDark : null]}>
          {t("splash.footerWith")}
        </Text>
        <Text style={[styles.accent, dark ? styles.accentDark : null]}>
          {t("splash.footerLove")}
        </Text>
        <Text style={[styles.muted, dark ? styles.mutedDark : null]}>
          {t("splash.footerInBerlin")}
        </Text>
        <Text style={[styles.sep, dark ? styles.sepDark : null]}>
          {t("splash.footerSep")}
        </Text>
        <Text style={[styles.brand, dark ? styles.brandDark : null]}>
          {t("splash.footerCompany")}
        </Text>
      </Text>
      <Text style={[styles.names, dark ? styles.namesDark : null]}>
        {t("splash.names")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 20,
    marginTop: 24,
    marginHorizontal: 22,
  },
  wrapCompact: {
    marginTop: 14,
  },
  decor: {
    width: 36,
    height: 1,
    backgroundColor: Theme.border,
    opacity: 0.9,
    marginBottom: 10,
  },
  decorDark: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  line: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.35,
  },
  muted: {
    color: Theme.muted,
    fontWeight: "500",
  },
  mutedDark: {
    color: "rgba(255,255,255,0.58)",
  },
  accent: {
    color: Theme.text,
    fontWeight: "700",
  },
  accentDark: {
    color: "#FFFFFF",
  },
  sep: {
    color: Theme.muted,
    fontWeight: "400",
  },
  sepDark: {
    color: "rgba(255,255,255,0.5)",
  },
  brand: {
    color: Theme.sub,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  brandDark: {
    color: "rgba(255,255,255,0.84)",
  },
  names: {
    marginTop: 6,
    color: Theme.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  namesDark: {
    color: "rgba(255,255,255,0.46)",
  },
});
