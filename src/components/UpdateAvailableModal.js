import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../theme";
import { resolveStoreUpdateUrl } from "../config";

/**
 * Hinweis-Modal: neue Version verfügbar — Update oder Später.
 */
export default function UpdateAvailableModal({
  visible,
  requiredMinVersion,
  onLater,
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const currentVer =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "1.0.0";

  function openStore() {
    const u = resolveStoreUpdateUrl();
    if (u) {
      Linking.openURL(u).catch(() => {});
      return;
    }
    Alert.alert(
      t("gate.updateTitle"),
      t("gate.updateNoStoreUrl"),
      [{ text: t("common.ok") }]
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onLater}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onLater} />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
              marginBottom: insets.bottom > 0 ? 0 : 16,
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="rocket-outline" size={28} color={Theme.heroBg} />
          </View>
          <Text style={styles.title}>{t("gate.updateModalTitle")}</Text>
          <Text style={styles.sub}>{t("gate.updateModalSub")}</Text>
          <View style={styles.verRow}>
            <Text style={styles.verMuted}>
              {t("gate.currentVersion", { version: currentVer })}
            </Text>
            {requiredMinVersion ? (
              <Text style={styles.verMuted}>
                {" · "}
                {t("gate.minVersion", { version: requiredMinVersion })}
              </Text>
            ) : null}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPressed,
            ]}
            onPress={openStore}
          >
            <Text style={styles.btnPrimaryText}>{t("gate.updateNow")}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.btnGhost,
              pressed && styles.btnPressed,
            ]}
            onPress={onLater}
          >
            <Text style={styles.btnGhostText}>{t("gate.updateLater")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: Theme.sub,
    textAlign: "center",
    marginBottom: 10,
  },
  verRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  verMuted: {
    fontSize: 12,
    color: Theme.muted,
    textAlign: "center",
  },
  btnPrimary: {
    backgroundColor: Theme.heroBg,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 10,
  },
  btnGhost: {
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.88 },
  btnPrimaryText: {
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  btnGhostText: {
    color: Theme.sub,
    fontSize: 16,
    fontWeight: "600",
  },
});
