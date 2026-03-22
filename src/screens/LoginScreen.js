import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { LanguageToggle } from "../components/LanguageToggle";
import {
  OutlinedInput,
  PasswordToggle,
} from "../components/OutlinedInput";
import { SplashStyleFooter } from "../components/SplashStyleFooter";
import { Theme } from "../theme";

const SUBMIT_BTN_H = 52;

const HEADER_GRAD = ["#F5F5F1", "#EBEBE6", "#E4E4DF"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(email, password, t) {
  const e = email.trim();
  if (!e) {
    return t("login.validation.emailRequired");
  }
  if (!EMAIL_RE.test(e)) {
    return t("login.validation.emailInvalid");
  }
  if (!password) {
    return t("login.validation.passwordRequired");
  }
  return null;
}

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const { setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const headerH = Math.min(300, Math.max(220, height * 0.3));

  async function onSubmit() {
    setError("");
    const v = validateLogin(email, password, t);
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      await setToken(data.token, {
        role: data.user?.role === "admin" ? "admin" : "user",
      });
      Keyboard.dismiss();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  function onForgotPassword() {
    Alert.alert(t("login.forgotTitle"), t("login.forgotBody"), [
      { text: t("common.ok") },
    ]);
  }

  function onSocial() {
    Alert.alert("", t("login.socialSoon"), [{ text: t("common.ok") }]);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.headerShell, { minHeight: headerH }]}>
              <LinearGradient
                colors={HEADER_GRAD}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.headerInner}>
                <View style={styles.topRow}>
                  <View style={[styles.topRowSide, styles.topRowSideStart]}>
                    {navigation.canGoBack() ? (
                      <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backCircle}
                        hitSlop={12}
                      >
                        <Text style={styles.backChevron}>‹</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.backCirclePlaceholder} />
                    )}
                  </View>
                  <View style={[styles.topRowSide, styles.topRowSideEnd]}>
                    <LanguageToggle variant="light" layout="chips" compact />
                  </View>
                </View>
                <Text style={styles.headline}>{t("login.headline")}</Text>
                <Text style={styles.subline}>{t("login.subline")}</Text>
              </View>
            </View>

            <View style={styles.formBlock}>
              <OutlinedInput
                label={t("login.email")}
                value={email}
                onChangeText={setEmail}
                placeholder={t("login.emailPh")}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!loading}
                labelBackgroundColor={Theme.bg}
              />

              <OutlinedInput
                label={t("login.password")}
                value={password}
                onChangeText={setPassword}
                placeholder={t("login.passwordPh")}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                editable={!loading}
                onSubmitEditing={onSubmit}
                labelBackgroundColor={Theme.bg}
                rightSlot={
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((s) => !s)}
                    labelShow={t("login.show")}
                    labelHide={t("login.hide")}
                  />
                }
              />

              <Pressable
                style={styles.forgotLink}
                onPress={onForgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotText}>{t("login.forgot")}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && !loading ? styles.btnPressed : null,
                ]}
                onPress={onSubmit}
                disabled={loading}
              >
                <View style={styles.btnGradInner}>
                  {loading ? (
                    <ActivityIndicator color={Theme.onWhite} size="small" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>{t("login.submit")}</Text>
                  )}
                </View>
              </Pressable>

              <View style={styles.socialDividerRow}>
                <View style={styles.socialLine} />
                <Text style={styles.socialDividerText}>
                  {t("login.socialDivider")}
                </Text>
                <View style={styles.socialLine} />
              </View>

              <View style={styles.socialRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    styles.socialBtnFirst,
                    pressed ? styles.socialPressed : null,
                  ]}
                  onPress={onSocial}
                >
                  <View style={styles.socialGlyphBox}>
                    <Text style={styles.socialGlyphApple}>
                      {Platform.OS === "ios" ? "\uF8FF" : "A"}
                    </Text>
                  </View>
                  <View style={styles.socialTextCol}>
                    <Text style={styles.socialBrand}>{t("login.socialApple")}</Text>
                    <Text style={styles.socialSub}>{t("login.socialAppleSub")}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.socialBtn,
                    styles.socialBtnSecond,
                    pressed ? styles.socialPressed : null,
                  ]}
                  onPress={onSocial}
                >
                  <View style={[styles.socialGlyphBox, styles.socialGlyphGoogle]}>
                    <Text style={styles.socialGlyphG}>G</Text>
                  </View>
                  <View style={styles.socialTextCol}>
                    <Text style={styles.socialBrand}>{t("login.socialGoogle")}</Text>
                    <Text style={styles.socialSub}>{t("login.socialGoogleSub")}</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerQ}>{t("login.footerRegister")}</Text>
                <Pressable
                  onPress={() => navigation.navigate("Register")}
                  disabled={loading}
                >
                  <Text style={styles.footerLink}>
                    {t("login.footerRegisterLink")}
                  </Text>
                </Pressable>
              </View>
            </View>

            <SplashStyleFooter />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  headerShell: {
    marginHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  headerInner: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    minHeight: 44,
  },
  topRowSide: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  topRowSideStart: {
    justifyContent: "flex-start",
    flex: 1,
  },
  topRowSideEnd: {
    justifyContent: "flex-end",
    flex: 1,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  backCirclePlaceholder: {
    width: 44,
    height: 44,
  },
  backChevron: {
    color: Theme.text,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
  headline: {
    color: Theme.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subline: {
    color: Theme.sub,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  formBlock: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: -10,
    marginBottom: 14,
    paddingVertical: 4,
  },
  forgotText: {
    color: Theme.sub,
    fontSize: 13,
    fontWeight: "600",
  },
  error: { color: Theme.error, marginBottom: 10, fontSize: 14 },
  btnPrimary: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Theme.heroBg,
    minHeight: SUBMIT_BTN_H,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  btnGradInner: {
    minHeight: SUBMIT_BTN_H,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextPrimary: {
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  btnPressed: { opacity: 0.92 },
  socialDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 18,
  },
  socialLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.border,
  },
  socialDividerText: {
    color: Theme.muted,
    fontSize: 12,
    paddingHorizontal: 12,
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    minHeight: 58,
  },
  socialBtnFirst: {
    marginRight: 8,
  },
  socialBtnSecond: {
    marginLeft: 8,
  },
  socialPressed: {
    opacity: 0.88,
  },
  socialGlyphBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  socialGlyphGoogle: {
    backgroundColor: Theme.white,
    borderColor: Theme.border,
  },
  socialGlyphApple: {
    color: Theme.text,
    fontSize: 22,
    fontWeight: "600",
    marginTop: Platform.OS === "ios" ? -1 : 0,
  },
  socialGlyphG: {
    color: Theme.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  socialTextCol: {
    flex: 1,
    justifyContent: "center",
  },
  socialBrand: {
    color: Theme.text,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  socialSub: {
    color: Theme.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.15,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 28,
    alignItems: "center",
  },
  footerQ: { color: Theme.sub, fontSize: 15 },
  footerLink: {
    color: Theme.heroBg,
    fontSize: 15,
    fontWeight: "700",
  },
});
