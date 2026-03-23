import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function PrivateTradeInviteScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [meUser, setMeUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!token) {
          setMeUser(null);
          setLoadingMe(false);
          return;
        }
        setLoadingMe(true);
        try {
          const data = await api("/api/users/me", { token });
          if (!cancelled && data?.user) {
            setMeUser(data.user);
          }
        } catch {
          if (!cancelled) {
            setMeUser(null);
          }
        } finally {
          if (!cancelled) {
            setLoadingMe(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  const hasAccess = Boolean(meUser?.private_market_access);

  async function onRedeem() {
    setError("");
    const raw = String(code || "").trim();
    if (raw.length < 4) {
      setError(t("privateInvite.codeTooShort"));
      return;
    }
    if (!token) {
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/api/private-market/redeem", {
        token,
        method: "POST",
        body: { code: raw },
      });
      if (data?.already_member) {
        Alert.alert("", t("privateInvite.alreadyMember"));
      } else {
        Alert.alert("", t("privateInvite.success"), [
          { text: t("common.ok"), onPress: () => navigation.goBack() },
        ]);
      }
      setMeUser((u) => (u ? { ...u, private_market_access: true } : u));
      setCode("");
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>
      </View>
    );
  }

  if (loadingMe) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 20) + 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="dark" />

      <View style={styles.heroIcon}>
        <Ionicons name="mail-unread-outline" size={40} color={Theme.heroBg} />
      </View>
      <Text style={styles.title}>{t("privateInvite.title")}</Text>
      <Text style={styles.lead}>{t("privateInvite.lead")}</Text>
      <Text style={styles.bullets}>{t("privateInvite.bullet1")}</Text>
      <Text style={styles.bullets}>{t("privateInvite.bullet2")}</Text>
      <Text style={styles.bullets}>{t("privateInvite.bullet3")}</Text>

      {hasAccess ? (
        <View style={styles.memberCard}>
          <Ionicons name="checkmark-circle" size={28} color={Theme.accentGreen} />
          <Text style={styles.memberTitle}>{t("privateInvite.memberTitle")}</Text>
          <Text style={styles.memberSub}>{t("privateInvite.memberSub")}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>{t("privateInvite.codeLabel")}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(s) => setCode(s.toUpperCase())}
            placeholder={t("privateInvite.codePh")}
            placeholderTextColor={Theme.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!submitting}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {submitting ? (
            <ActivityIndicator color={Theme.text} style={styles.spinner} />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                pressed ? styles.btnPressed : null,
              ]}
              onPress={onRedeem}
            >
              <Text style={styles.btnText}>{t("privateInvite.redeem")}</Text>
            </Pressable>
          )}
        </>
      )}

      <Text style={styles.foot}>{t("privateInvite.foot")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: {
    flex: 1,
    backgroundColor: Theme.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  muted: { color: Theme.muted, fontSize: 15 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  lead: {
    fontSize: 15,
    color: Theme.sub,
    lineHeight: 22,
    marginBottom: 14,
  },
  bullets: {
    fontSize: 14,
    color: Theme.muted,
    lineHeight: 21,
    marginBottom: 6,
    paddingLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
    color: Theme.text,
  },
  error: {
    color: Theme.error,
    fontSize: 14,
    marginTop: 10,
  },
  spinner: { marginTop: 20 },
  btn: {
    marginTop: 20,
    backgroundColor: Theme.heroBg,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.9 },
  btnText: { color: Theme.onWhite, fontSize: 16, fontWeight: "700" },
  memberCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    alignItems: "center",
  },
  memberTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
    color: Theme.text,
    textAlign: "center",
  },
  memberSub: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.sub,
    textAlign: "center",
    lineHeight: 20,
  },
  foot: {
    marginTop: 28,
    fontSize: 12,
    color: Theme.muted,
    lineHeight: 18,
  },
});
