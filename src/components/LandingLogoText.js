import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text } from "react-native";

/**
 * Markenzeile mit optionalem Präfix „| “ — „Landeanflug“-Animation.
 */
export function LandingLogoText({ style, children = "VUREX", showPipe = true }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.back(1.05)),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 1],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <Animated.View
      style={[
        styles.holder,
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.line}>
        {showPipe ? <Text style={styles.pipe}>| </Text> : null}
        <Text style={styles.word}>{children}</Text>
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  holder: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  line: {
    textAlign: "center",
  },
  pipe: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 36,
    fontWeight: Platform.select({ android: "300", default: "200" }),
    letterSpacing: 0,
    lineHeight: 42,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  word: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 3.2,
    lineHeight: 42,
    textShadowColor: "rgba(255,255,255,0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
});
