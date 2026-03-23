import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { AuthVideoBackdrop } from "../components/AuthVideoBackdrop";
import { LandingLogoText } from "../components/LandingLogoText";
import {
  AUTH_BTN_PRIMARY,
  AUTH_ROOT_BG,
  UI_BORDER_INPUT,
  UI_INPUT_FILL,
  UI_PAGE_GUTTER,
  UI_RADIUS_MD,
} from "../constants/authTheme";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { token, userProfile, signOut, refreshUserProfile } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendSec, setResendSec] = useState(0);

  useEffect(() => {
    if (resendSec <= 0) {
      return undefined;
    }
    const id = setInterval(() => {
      setResendSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendSec]);

  const onSubmit = useCallback(async () => {
    const digits = code.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setError(t("verifyEmail.validation.sixDigits"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/verify-email", {
        token,
        method: "POST",
        body: { code: digits },
      });
      await refreshUserProfile();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [code, refreshUserProfile, t, token]);

  const onResend = useCallback(async () => {
    if (resendSec > 0 || resendBusy) {
      return;
    }
    setError("");
    setResendBusy(true);
    try {
      await api("/api/auth/resend-verification", { token, method: "POST" });
      setResendSec(60);
    } catch (e) {
      const msg = e.message || "";
      const m = /(\d+)\s*Sekunden|(\d+)\s*seconds/i.exec(msg);
      const wait = m ? Number(m[1] || m[2]) : 0;
      if (wait > 0) {
        setResendSec(Math.min(120, wait));
      }
      setError(msg || t("common.error"));
    } finally {
      setResendBusy(false);
    }
  }, [resendBusy, resendSec, t, token]);

  const email = userProfile?.email || "";

  return (
    <View style={styles.root}>
      <AuthVideoBackdrop />
      <StatusBar style="light" />
      <SafeAreaView style={[styles.safe, styles.safeAboveVideo]} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.inner}>
            <LandingLogoText style={styles.logoMark} />
            <Text style={styles.eyebrow}>{t("verifyEmail.eyebrow")}</Text>
            <Text style={styles.headline}>{t("verifyEmail.headline")}</Text>
            <Text style={styles.subline}>{t("verifyEmail.subline")}</Text>
            {email ? <Text style={styles.emailHint}>{email}</Text> : null}

            <Text style={styles.fieldLabel}>{t("verifyEmail.codeLabel")}</Text>
            <TextInput
              value={code}
              onChangeText={(t0) => setCode(t0.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("verifyEmail.codePh")}
              placeholderTextColor="rgba(255,255,255,0.42)"
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              editable={!loading}
              style={styles.codeInput}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && !loading ? styles.btnPressed : null,
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              <View style={styles.btnInner}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>{t("verifyEmail.submit")}</Text>
                )}
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.resendBtn,
                (resendSec > 0 || resendBusy) && styles.resendDisabled,
                pressed && resendSec === 0 && !resendBusy ? styles.btnPressed : null,
              ]}
              onPress={onResend}
              disabled={resendSec > 0 || resendBusy}
            >
              <Text style={styles.resendText}>
                {resendSec > 0
                  ? t("verifyEmail.resendWait", { sec: resendSec })
                  : t("verifyEmail.resend")}
              </Text>
            </Pressable>

            <Pressable style={styles.signOutWrap} onPress={() => signOut()}>
              <Text style={styles.signOutText}>{t("verifyEmail.signOut")}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH_ROOT_BG },
  safe: { flex: 1, backgroundColor: "transparent" },
  safeAboveVideo: {
    zIndex: 2,
    elevation: 2,
  },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: UI_PAGE_GUTTER,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: "center",
  },
  logoMark: { marginBottom: 18, alignSelf: "center" },
  eyebrow: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 10,
  },
  headline: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subline: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 10,
  },
  emailHint: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 22,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: UI_BORDER_INPUT,
    borderRadius: UI_RADIUS_MD,
    paddingHorizontal: 16,
    minHeight: 56,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    backgroundColor: UI_INPUT_FILL,
    marginBottom: 14,
  },
  error: { color: "#fca5a5", marginBottom: 12, fontSize: 14, textAlign: "center" },
  btnPrimary: {
    borderRadius: UI_RADIUS_MD,
    minHeight: 48,
    backgroundColor: AUTH_BTN_PRIMARY,
    borderWidth: 0,
    marginBottom: 14,
  },
  btnInner: {
    minHeight: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnPressed: { opacity: 0.9 },
  resendBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  resendDisabled: { opacity: 0.45 },
  resendText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  signOutWrap: {
    marginTop: 28,
    alignSelf: "center",
    paddingVertical: 8,
  },
  signOutText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
  },
});
