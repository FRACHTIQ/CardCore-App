import { useState } from "react";
import {
  ActivityIndicator,
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
import { Ionicons } from "@expo/vector-icons";
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
  const { height } = useWindowDimensions();
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

  const headerH = Math.min(280, Math.max(200, height * 0.26));

  async function onSubmit() {
    setError("");
    const v = validateRegister(
      displayName,
      email,
      password,
      passwordRepeat,
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
      });
      Keyboard.dismiss();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
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
                <Text style={styles.headline}>{t("register.headline")}</Text>
                <Text style={styles.subline}>{t("register.subline")}</Text>
              </View>
            </View>

            <View style={styles.formBlock}>
              <OutlinedInput
                label={t("register.displayName")}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t("register.displayNamePh")}
                autoCapitalize="words"
                autoCorrect
                editable={!loading}
                labelBackgroundColor={Theme.bg}
              />

              <OutlinedInput
                label={t("register.email")}
                value={email}
                onChangeText={setEmail}
                placeholder={t("register.emailPh")}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!loading}
                labelBackgroundColor={Theme.bg}
              />

              <OutlinedInput
                label={t("register.password")}
                value={password}
                onChangeText={setPassword}
                placeholder={t("register.passwordPh")}
                secureTextEntry={!showPw1}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                editable={!loading}
                labelBackgroundColor={Theme.bg}
                rightSlot={
                  <PasswordToggle
                    visible={showPw1}
                    onToggle={() => setShowPw1((s) => !s)}
                    labelShow={t("login.show")}
                    labelHide={t("login.hide")}
                  />
                }
              />

              <OutlinedInput
                label={t("register.repeatPassword")}
                value={passwordRepeat}
                onChangeText={setPasswordRepeat}
                placeholder={t("register.repeatPasswordPh")}
                secureTextEntry={!showPw2}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                editable={!loading}
                onSubmitEditing={onSubmit}
                labelBackgroundColor={Theme.bg}
                rightSlot={
                  <PasswordToggle
                    visible={showPw2}
                    onToggle={() => setShowPw2((s) => !s)}
                    labelShow={t("login.show")}
                    labelHide={t("login.hide")}
                  />
                }
              />

              <View style={styles.termsRow}>
                <Pressable
                  onPress={() => !loading && setAcceptedTerms((x) => !x)}
                  style={styles.checkHit}
                  hitSlop={8}
                >
                  <Ionicons
                    name={acceptedTerms ? "checkbox" : "square-outline"}
                    size={26}
                    color={acceptedTerms ? Theme.heroBg : Theme.muted}
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
                <View style={styles.btnGradInner}>
                  {loading ? (
                    <ActivityIndicator color={Theme.onWhite} size="small" />
                  ) : (
                    <Text style={styles.btnTextPrimary}>{t("register.submit")}</Text>
                  )}
                </View>
              </Pressable>

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
    paddingBottom: 20,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 4,
    paddingRight: 4,
  },
  checkHit: { marginRight: 10, paddingTop: 2 },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.sub,
  },
  termsLink: {
    color: Theme.heroBg,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  error: { color: Theme.error, marginBottom: 10, fontSize: 14 },
  btnPrimary: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Theme.heroBg,
    minHeight: SUBMIT_BTN_H,
    marginTop: 4,
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
