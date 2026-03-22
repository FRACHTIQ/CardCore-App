import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";

export function SplashStyleFooter() {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.decor} />
      <Text style={styles.line}>
        <Text style={styles.muted}>{t("splash.footerWith")}</Text>
        <Text style={styles.accent}>{t("splash.footerLove")}</Text>
        <Text style={styles.muted}>{t("splash.footerInBerlin")}</Text>
        <Text style={styles.sep}>{t("splash.footerSep")}</Text>
        <Text style={styles.brand}>{t("splash.footerCompany")}</Text>
      </Text>
      <Text style={styles.names}>{t("splash.names")}</Text>
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
  decor: {
    width: 36,
    height: 1,
    backgroundColor: Theme.border,
    opacity: 0.9,
    marginBottom: 10,
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
  accent: {
    color: Theme.text,
    fontWeight: "700",
  },
  sep: {
    color: Theme.muted,
    fontWeight: "400",
  },
  brand: {
    color: Theme.sub,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  names: {
    marginTop: 6,
    color: Theme.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    textAlign: "center",
  },
});
