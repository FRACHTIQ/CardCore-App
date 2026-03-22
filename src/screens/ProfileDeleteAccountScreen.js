import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function ProfileDeleteAccountScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const scrollContent = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 16) + 32,
  };

  function confirmDelete() {
    Alert.alert(
      t("profile.deleteConfirmTitle"),
      t("profile.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccountCta"),
          style: "destructive",
          onPress: () => runDelete(),
        },
      ]
    );
  }

  async function runDelete() {
    if (!token || busy) {
      return;
    }
    setBusy(true);
    try {
      await api("/api/users/me", { token, method: "DELETE" });
      await signOut();
    } catch (e) {
      Alert.alert(t("common.error"), e.message || "");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.intro}>{t("profile.deleteAccountIntro")}</Text>

      {busy ? (
        <ActivityIndicator color={Theme.text} style={styles.spinner} />
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.dangerBtn,
            pressed ? styles.dangerBtnPressed : null,
          ]}
          onPress={confirmDelete}
        >
          <Text style={styles.dangerBtnText}>{t("profile.deleteAccountCta")}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    color: Theme.sub,
    marginBottom: 24,
  },
  spinner: { marginVertical: 20 },
  dangerBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(220, 38, 38, 0.45)",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  dangerBtnPressed: { opacity: 0.9 },
  dangerBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.error,
  },
});
