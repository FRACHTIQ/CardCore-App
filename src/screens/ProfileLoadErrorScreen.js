import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { AUTH_BTN_PRIMARY, AUTH_ROOT_BG, UI_PAGE_GUTTER, UI_RADIUS_MD } from "../constants/authTheme";

export default function ProfileLoadErrorScreen() {
  const { t } = useTranslation();
  const { refreshUserProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onRetry() {
    setBusy(true);
    try {
      await refreshUserProfile();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.inner}>
          <Text style={styles.title}>{t("profileLoadError.title")}</Text>
          <Text style={styles.body}>{t("profileLoadError.body")}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              (pressed && !busy) || busy ? styles.btnPressed : null,
            ]}
            onPress={onRetry}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnLabel}>{t("profileLoadError.retry")}</Text>
            )}
          </Pressable>
          <Pressable style={styles.signOut} onPress={() => signOut()}>
            <Text style={styles.signOutLabel}>{t("profileLoadError.signOut")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH_ROOT_BG },
  safe: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: UI_PAGE_GUTTER,
  },
  title: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  btn: {
    backgroundColor: AUTH_BTN_PRIMARY,
    borderRadius: UI_RADIUS_MD,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  btnPressed: { opacity: 0.88 },
  btnLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  signOut: { marginTop: 20, alignSelf: "center", paddingVertical: 10 },
  signOutLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "600",
  },
});
