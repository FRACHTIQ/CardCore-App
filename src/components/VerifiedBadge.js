import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";

/** Einheitliches „Verifiziert“-Pill (Profil-Hub + öffentliches Profil). */
export function VerifiedBadge() {
  const { t } = useTranslation();
  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={t("profile.verified")}
    >
      <Ionicons name="checkmark-circle" size={11} color={Theme.accentGreen} />
      <Text style={styles.txt}>{t("profile.verified")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 0,
    minHeight: 22,
    borderRadius: 999,
    backgroundColor: "rgba(21,128,61,0.12)",
  },
  txt: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 12,
    color: Theme.accentGreen,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
});
