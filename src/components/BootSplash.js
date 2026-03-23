import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SPLASH_MS, SPLASH_BG, BAR_FILL, BAR_TRACK } from "../constants/splash";

const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

/**
 * @param {{ progressDurationMs?: number }} [props]
 * Standard = SPLASH_MS (5s Root-Boot). Kurz für i18n in App.js.
 */
export function BootSplash({ progressDurationMs } = {}) {
  const duration =
    typeof progressDurationMs === "number" && progressDurationMs > 0
      ? progressDurationMs
      : SPLASH_MS;
  const progress = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [progress, duration]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setPct(Math.min(100, Math.round(value * 100)));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.root, { backgroundColor: SPLASH_BG }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.mark}>
            <Text style={styles.pipe}>| </Text>
            <Text style={styles.word}>VUREX</Text>
          </Text>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { width: barWidth }]} />
          </View>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  mark: {
    marginBottom: 28,
  },
  pipe: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 32,
    fontWeight: "200",
    letterSpacing: 0,
  },
  word: {
    color: "#FAFAFA",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
  },
  barTrack: {
    width: "100%",
    maxWidth: 220,
    height: 3,
    borderRadius: 2,
    backgroundColor: BAR_TRACK,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: BAR_FILL,
  },
  pct: {
    marginTop: 14,
    fontFamily: mono,
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    fontVariant: ["tabular-nums"],
  },
});
