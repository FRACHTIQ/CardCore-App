import { StyleSheet, Text, View } from "react-native";
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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Theme.heroBg,
  },
  wrapCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  txt: {
    fontSize: 12,
    fontWeight: "800",
    color: Theme.onWhite,
    letterSpacing: 0.2,
  },
  txtCompact: {
    fontSize: 10,
    fontWeight: "800",
  },
});
