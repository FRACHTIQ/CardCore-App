import { Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";

/**
 * Kennzeichnet Plattform-Admins (role = admin) für andere Nutzer sichtbar.
 */
export function TeamAdminBadge({ compact = false }) {
  const { t } = useTranslation();
  return (
    <View
      style={[styles.wrap, compact ? styles.wrapCompact : null]}
      accessibilityRole="text"
      accessibilityLabel={t("profile.teamAdminBadgeA11y")}
    >
      <Ionicons
        name="shield-checkmark"
        size={compact ? 11 : 13}
        color={Theme.onWhite}
      />
      <Text style={[styles.txt, compact ? styles.txtCompact : null]}>
        {t("profile.teamAdminBadge")}
      </Text>
    </View>
  );
}

const BADGE_MIN_H = 22;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: BADGE_MIN_H,
    borderRadius: 999,
    backgroundColor: Theme.heroBg,
  },
  wrapCompact: {
    paddingHorizontal: 8,
    paddingVertical: 0,
    gap: 4,
    minHeight: BADGE_MIN_H,
  },
  txt: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.onWhite,
    letterSpacing: 0.2,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  txtCompact: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
});
