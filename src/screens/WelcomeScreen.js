import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageToggle } from "../components/LanguageToggle";
import { Theme } from "../theme";

const HERO_URI =
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=85";

export default function WelcomeScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={{ uri: HERO_URI }}
        style={styles.hero}
        resizeMode="cover"
      >
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
          locations={[0, 0.45, 1]}
          style={styles.heroFade}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.15)", "transparent"]}
          locations={[0, 0.45, 1]}
          style={styles.heroTopFade}
        />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Text style={styles.langLabel}>{t("welcome.languageLabel")}</Text>
            <LanguageToggle variant="dark" layout="segmented" />
          </View>
          <View style={styles.spacer} />
          <View style={styles.footer}>
            <Text style={styles.logoMark}>VUREX</Text>
            <Text style={styles.tagline}>
              {t("welcome.taglineLine1")}
              {"\n"}
              {t("welcome.taglineLine2")}
            </Text>
            <View style={styles.socialRow}>
              <View style={styles.avatarCluster}>
                <View style={[styles.avatar, styles.avatarA]} />
                <View style={[styles.avatar, styles.avatarB]} />
                <View style={[styles.avatar, styles.avatarC]} />
              </View>
              <Text style={styles.socialText}>{t("welcome.social")}</Text>
            </View>
            <View style={styles.btnRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnLogin,
                  pressed ? styles.btnPressed : null,
                ]}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.btnLoginLabel}>{t("welcome.login")}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed ? styles.btnPressed : null,
                ]}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.btnPrimaryLabel}>{t("welcome.cta")}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  hero: { flex: 1, width: "100%", justifyContent: "flex-end" },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 168,
    zIndex: 1,
  },
  safe: { flex: 1, zIndex: 2 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 2,
  },
  langLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  spacer: { flex: 1 },
  footer: {
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  logoMark: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  tagline: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 32,
    textTransform: "uppercase",
    marginBottom: 22,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  avatarCluster: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  avatarA: {
    backgroundColor: "#94a3b8",
    zIndex: 3,
  },
  avatarB: {
    marginLeft: -14,
    backgroundColor: "#64748b",
    zIndex: 2,
  },
  avatarC: {
    marginLeft: -14,
    backgroundColor: "#475569",
    zIndex: 1,
  },
  socialText: {
    color: "#e4e4e7",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  btnLogin: {
    flex: 1,
    marginRight: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.72)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnPrimary: {
    flex: 1.22,
    marginLeft: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.heroBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPressed: { opacity: 0.92 },
  btnLoginLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnPrimaryLabel: {
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
