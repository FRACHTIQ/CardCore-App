import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SPLASH_MS,
  SPLASH_BG,
  BAR_FILL,
  BAR_TRACK,
  MADE_MUTED,
  MADE_HEART,
  MADE_BRAND,
} from "../constants/splash";

export function BootSplash() {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPct(0);
    progress.setValue(0);
    const listenerId = progress.addListener(({ value }) => {
      setPct(Math.round(value * 100));
    });
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPct(100);
      }
    });
    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.boot}>
      <StatusBar style="dark" />
      <View style={styles.bootCenter}>
        <View style={styles.bootInner}>
          <Text style={styles.bootLogo}>VUREX</Text>
          <Text style={styles.pctText}>{pct}%</Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFillWrap,
                { width: barWidth, backgroundColor: BAR_FILL },
              ]}
            />
          </View>
        </View>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.bootFooter}>
        <View style={styles.bootFooterDecor} />
        <Text style={styles.bootFooterLine}>
          <Text style={styles.bootFooterMuted}>{t("splash.footerWith")}</Text>
          <Text style={styles.bootFooterAccent}>{t("splash.footerLove")}</Text>
          <Text style={styles.bootFooterMuted}>{t("splash.footerInBerlin")}</Text>
          <Text style={styles.bootFooterSep}>{t("splash.footerSep")}</Text>
          <Text style={styles.bootFooterBrand}>{t("splash.footerCompany")}</Text>
        </Text>
        <Text style={styles.bootFooterNames}>{t("splash.names")}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  bootCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bootInner: {
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  bootLogo: {
    color: "#1A1A1A",
    fontSize: 42,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: -1,
    marginBottom: 20,
  },
  pctText: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 10,
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: BAR_TRACK,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFillWrap: {
    height: "100%",
    borderRadius: 2,
  },
  bootFooter: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  bootFooterDecor: {
    width: 36,
    height: 1,
    backgroundColor: "#D4D4CE",
    opacity: 0.9,
    marginBottom: 10,
  },
  bootFooterLine: {
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.35,
  },
  bootFooterMuted: {
    color: MADE_MUTED,
    fontWeight: "500",
  },
  bootFooterAccent: {
    color: MADE_HEART,
    fontWeight: "700",
  },
  bootFooterSep: {
    color: "#52525b",
    fontWeight: "400",
  },
  bootFooterBrand: {
    color: MADE_BRAND,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bootFooterNames: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
