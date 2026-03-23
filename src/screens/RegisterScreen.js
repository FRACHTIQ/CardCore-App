import { useMemo, useState } from "react";
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
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { AuthVideoBackdrop } from "../components/AuthVideoBackdrop";
import { EmailFormSheet } from "../components/EmailFormSheet";
import { LandingLogoText } from "../components/LandingLogoText";
import {
  AUTH_BTN_EMAIL,
  AUTH_BTN_PRIMARY,
  AUTH_FORM_SCRIM_GLASS,
  AUTH_HERO_FOOTER_GAP,
  AUTH_ROOT_BG,
  UI_BORDER_INPUT,
  UI_BORDER_SUBTLE,
  UI_DIVIDER_LINE,
  UI_INPUT_FILL,
  UI_PAGE_GUTTER,
  UI_RADIUS_LG,
  UI_RADIUS_MD,
  getAuthFooterInnerPad,
  getAuthSheetScrollMaxHeight,
} from "../constants/authTheme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(
  displayName,
  email,
  password,
  passwordRepeat,
  acceptTerms,
  t
) {
  const name = displayName.trim();
  if (!name) {
    return t("register.validation.displayNameRequired");
  }
  const e = email.trim();
  if (!e) {
    return t("register.validation.emailRequired");
  }
  if (!EMAIL_RE.test(e)) {
    return t("register.validation.emailInvalid");
  }
  if (!password) {
    return t("register.validation.passwordRequired");
  }
  if (password.length < 8) {
    return t("register.validation.passwordShort");
  }
  if (password !== passwordRepeat) {
    return t("register.validation.passwordMismatch");
  }
  if (!acceptTerms) {
    return t("register.validation.termsRequired");
  }
  return null;
}

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const { setToken } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [registerFooterH, setRegisterFooterH] = useState(0);

  const sheetScrollMaxH = useMemo(
    () => getAuthSheetScrollMaxHeight(winH, insets),
    [winH, insets],
  );
  const footerInnerPad = useMemo(() => getAuthFooterInnerPad(winH), [winH]);

  async function onSubmit() {
    setError("");
    const v = validateRegister(
      displayName,
      email,
      password,
      passwordRepeat,
      acceptedTerms,
      t,
    );
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          accept_terms: true,
        },
      });
      await setToken(data.token, {
        role: data.user?.role === "admin" ? "admin" : "user",
        user: data.user,
      });
      Keyboard.dismiss();
      setShowEmailForm(false);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  function onSocial() {
    Alert.alert("", t("login.socialSoon"), [{ text: t("common.ok") }]);
  }

  return (
    <View style={styles.root}>
      <AuthVideoBackdrop />
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.mainColumn}>
            <View
              style={[
                styles.heroBlock,
                registerFooterH > 0 && {
                  paddingBottom: registerFooterH + AUTH_HERO_FOOTER_GAP,
                },
              ]}
            >
              <LandingLogoText style={styles.logoMark} />
              <Text style={styles.eyebrow}>{t("register.eyebrow")}</Text>
              <Text style={styles.headline}>{t("register.headline")}</Text>
              <Text style={styles.subline}>{t("register.subline")}</Text>
            </View>

            <View
              style={[
                styles.authFooterWrap,
                {
                  paddingBottom: insets.bottom + footerInnerPad,
                },
              ]}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0 && Math.abs(h - registerFooterH) > 0.5) {
                  setRegisterFooterH(h);
                }
              }}
            >
              <View style={styles.formBlock}>
                <ScrollView
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: sheetScrollMaxH }}
                  contentContainerStyle={styles.footerScrollContent}
                >
                  <View style={styles.sheetActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.socialBtn,
                        styles.socialBtnLight,
                        pressed ? styles.btnPressed : null,
                      ]}
                      onPress={onSocial}
                    >
                      <Ionicons name="logo-google" size={16} color="#121317" />
                      <Text style={styles.socialBtnLightText}>
                        {t("login.socialGoogle")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.socialBtn,
                        styles.socialBtnLight,
                        pressed ? styles.btnPressed : null,
                      ]}
                      onPress={onSocial}
                    >
                      <Ionicons name="logo-apple" size={16} color="#121317" />
                      <Text style={styles.socialBtnLightText}>
                        {t("login.socialApple")}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.btnEmail,
                        pressed && !loading ? styles.btnPressed : null,
                      ]}
                      onPress={() => setShowEmailForm(true)}
                    >
                      <View style={styles.btnInner}>
                        <Text style={styles.btnEmailText}>
                          {t("login.continueEmail")}
                        </Text>
                      </View>
                    </Pressable>
                    <Text style={styles.agreeText}>{t("login.agreementLine")}</Text>

                    <View style={styles.footerRow}>
                      <Text style={styles.footerQ}>{t("register.footerLogin")}</Text>
                      <Pressable
                        onPress={() => navigation.navigate("Login")}
                        disabled={loading}
                      >
                        <Text style={styles.footerLink}>
                          {t("register.footerLoginLink")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          <EmailFormSheet
            visible={showEmailForm}
            title={t("login.continueEmail")}
            onClose={() => setShowEmailForm(false)}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("register.divider")}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{t("register.displayName")}</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t("register.displayNamePh")}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  autoCapitalize="words"
                  autoCorrect
                  editable={!loading}
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{t("register.email")}</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("register.emailPh")}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!loading}
                  style={styles.fieldInput}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{t("register.password")}</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("register.passwordPh")}
                    placeholderTextColor="rgba(255,255,255,0.42)"
                    secureTextEntry={!showPw1}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!loading}
                    style={[styles.fieldInput, styles.passwordInput]}
                  />
                  <Pressable
                    onPress={() => setShowPw1((s) => !s)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Text style={styles.eyeText}>
                      {showPw1 ? t("login.hide") : t("login.show")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{t("register.repeatPassword")}</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    value={passwordRepeat}
                    onChangeText={setPasswordRepeat}
                    placeholder={t("register.repeatPasswordPh")}
                    placeholderTextColor="rgba(255,255,255,0.42)"
                    secureTextEntry={!showPw2}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="go"
                    editable={!loading}
                    onSubmitEditing={onSubmit}
                    style={[styles.fieldInput, styles.passwordInput]}
                  />
                  <Pressable
                    onPress={() => setShowPw2((s) => !s)}
                    hitSlop={8}
                    style={styles.eyeBtn}
                  >
                    <Text style={styles.eyeText}>
                      {showPw2 ? t("login.hide") : t("login.show")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.termsRow}>
                <Pressable
                  onPress={() => !loading && setAcceptedTerms((x) => !x)}
                  style={styles.checkHit}
                  hitSlop={8}
                >
                  <Ionicons
                    name={acceptedTerms ? "checkbox" : "square-outline"}
                    size={24}
                    color={acceptedTerms ? "#fff" : "rgba(255,255,255,0.6)"}
                  />
                </Pressable>
                <Text style={styles.termsText}>
                  <Text>{t("register.acceptTermsPrefix")}</Text>
                  <Text
                    style={styles.termsLink}
                    onPress={() =>
                      navigation.navigate("LegalTerms", { kind: "terms" })
                    }
                  >
                    {t("register.acceptTermsLink")}
                  </Text>
                </Text>
              </View>

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
                    <Text style={styles.btnTextPrimary}>{t("register.submit")}</Text>
                  )}
                </View>
              </Pressable>
            </ScrollView>
          </EmailFormSheet>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH_ROOT_BG },
  safe: { flex: 1, backgroundColor: "transparent" },
  flex: { flex: 1 },
  mainColumn: {
    flex: 1,
    position: "relative",
  },
  authFooterWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerScrollContent: {
    paddingBottom: 8,
  },
  sheetActions: {
    width: "100%",
  },
  heroBlock: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: UI_PAGE_GUTTER,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: "center",
  },
  logoMark: {
    marginBottom: 14,
  },
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subline: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  formBlock: {
    paddingHorizontal: UI_PAGE_GUTTER,
    paddingTop: 12,
    paddingBottom: 4,
    marginTop: 0,
    borderTopLeftRadius: UI_RADIUS_LG,
    borderTopRightRadius: UI_RADIUS_LG,
    backgroundColor: AUTH_FORM_SCRIM_GLASS,
    overflow: "hidden",
    borderWidth: 0,
  },
  socialBtn: {
    minHeight: 44,
    borderRadius: UI_RADIUS_MD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 6,
  },
  socialBtnLight: {
    backgroundColor: "#fff",
  },
  socialBtnLightText: {
    color: "#0f1014",
    fontSize: 14,
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 10,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerQ: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
  },
  footerLink: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: UI_DIVIDER_LINE,
  },
  dividerText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 11,
    paddingHorizontal: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: UI_BORDER_INPUT,
    borderRadius: UI_RADIUS_MD,
    paddingHorizontal: 14,
    minHeight: 50,
    color: "#fff",
    fontSize: 16,
    backgroundColor: UI_INPUT_FILL,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    marginRight: 8,
  },
  eyeBtn: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: UI_BORDER_SUBTLE,
    borderRadius: UI_RADIUS_MD,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI_INPUT_FILL,
  },
  eyeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 16,
    paddingRight: 4,
  },
  checkHit: { marginRight: 10, paddingTop: 1 },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.68)",
  },
  termsLink: {
    color: "#fff",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  error: { color: "#fca5a5", marginBottom: 10, fontSize: 14 },
  btnPrimary: {
    borderRadius: UI_RADIUS_MD,
    minHeight: 44,
    backgroundColor: AUTH_BTN_PRIMARY,
    borderWidth: 0,
  },
  btnEmail: {
    borderRadius: UI_RADIUS_MD,
    minHeight: 44,
    backgroundColor: AUTH_BTN_EMAIL,
    borderWidth: 0,
  },
  btnEmailText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  agreeText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  btnInner: {
    minHeight: 44,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextPrimary: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  btnPressed: { opacity: 0.9 },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  miniDot: { color: "rgba(255,255,255,0.62)", fontSize: 8, width: 10 },
  miniText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10.2,
    lineHeight: 14,
    flex: 1,
  },
  sheetScroll: {
    paddingBottom: 12,
  },
});




