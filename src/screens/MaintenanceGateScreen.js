import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { APP_NAME, PRIMARY } from "../config";
import { SplashStyleFooter } from "../components/SplashStyleFooter";

const HEADER_GRAD = ["#F5F5F1", "#EBEBE6", "#E4E4DF"];

const CARD_W = 46;
const CARD_H = 64;
const FIGURE_W = 56;

function TraderFigure({ align }) {
  return (
    <View style={[styles.figureCol, align === "right" && styles.figureColRight]}>
      <View style={styles.figureHead}>
        <View style={styles.figureFace} />
      </View>
      <View style={styles.figureBody}>
        <LinearGradient
          colors={["rgba(140, 29, 24, 0.12)", "rgba(140, 29, 24, 0.22)"]}
          style={styles.figureBodyGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View style={[styles.figureHand, align === "left" ? styles.handRight : styles.handLeft]} />
    </View>
  );
}

function MiniCard({ tint }) {
  return (
    <View style={[styles.miniCard, { borderColor: tint }]}>
      <LinearGradient
        colors={["#FFFFFF", "#F5F5F1"]}
        style={styles.miniCardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.miniCardStripe, { backgroundColor: tint }]} />
        <View style={styles.miniCardShine} />
      </LinearGradient>
    </View>
  );
}

export default function MaintenanceGateScreen({ message, onRetry }) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [laneW, setLaneW] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const body =
    message && String(message).trim()
      ? String(message).trim()
      : t("gate.maintenanceDefault");

  const travel = Math.max(0, laneW - CARD_W);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(380),
        Animated.timing(progress, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(380),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const txRight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, travel],
  });
  const txLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -travel],
  });

  async function handleRetry() {
    if (!onRetry || checking) {
      return;
    }
    setChecking(true);
    try {
      await onRetry();
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerShell}>
            <LinearGradient
              colors={HEADER_GRAD}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.headerInner}>
              <Text style={styles.brandEyebrow}>{APP_NAME}</Text>
              <Text style={styles.headline}>{t("gate.maintenanceTitle")}</Text>
              <Text style={styles.subline}>{t("gate.maintenanceSub")}</Text>
            </View>
          </View>

          <View style={styles.sceneWrap}>
            <Text style={styles.sceneCaption}>{t("gate.maintenanceSceneCaption")}</Text>
            <View style={styles.sceneRow}>
              <TraderFigure align="left" />
              <View
                style={styles.lane}
                onLayout={(e) => setLaneW(e.nativeEvent.layout.width)}
              >
                {laneW > 0 ? (
                  <>
                    <Animated.View
                      style={[
                        styles.cardSlot,
                        {
                          transform: [
                            { translateX: txRight },
                            { translateY: -6 },
                          ],
                          zIndex: 2,
                        },
                      ]}
                    >
                      <MiniCard tint={PRIMARY} />
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.cardSlot,
                        {
                          left: travel,
                          transform: [
                            { translateX: txLeft },
                            { translateY: 6 },
                          ],
                          zIndex: 1,
                        },
                      ]}
                    >
                      <MiniCard tint={Theme.accentTeal} />
                    </Animated.View>
                  </>
                ) : null}
              </View>
              <TraderFigure align="right" />
            </View>
          </View>

          <View style={styles.formBlock}>
            <View style={styles.messageCard}>
              <View style={styles.cardAccent} />
              <Text style={styles.cardLabel}>{t("gate.maintenanceMessageLabel")}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && !checking ? styles.btnPressed : null,
              ]}
              onPress={handleRetry}
              disabled={checking || !onRetry}
              accessibilityRole="button"
              accessibilityLabel={t("gate.retryCheck")}
            >
              <View style={styles.btnGradInner}>
                {checking ? (
                  <ActivityIndicator color={Theme.onWhite} size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color={Theme.onWhite} />
                    <Text style={styles.btnTextPrimary}>{t("gate.retryCheck")}</Text>
                  </>
                )}
              </View>
            </Pressable>

            <Text style={styles.hint}>{t("gate.maintenanceRetryHint")}</Text>
          </View>

          <SplashStyleFooter />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.bg,
  },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollInner: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  headerShell: {
    marginHorizontal: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
    minHeight: 200,
  },
  headerInner: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
  },
  brandEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    color: Theme.muted,
    marginBottom: 14,
    textAlign: "center",
  },
  headline: {
    color: Theme.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subline: {
    color: Theme.sub,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  sceneWrap: {
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  sceneCaption: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.muted,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.4,
  },
  sceneRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: CARD_H + FIGURE_W * 0.4 + 8,
  },
  figureCol: {
    position: "relative",
    width: FIGURE_W,
    alignItems: "center",
  },
  figureColRight: {
    alignItems: "center",
  },
  figureHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  figureFace: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(26,26,26,0.08)",
  },
  figureBody: {
    width: 44,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  figureBodyGrad: {
    flex: 1,
  },
  figureHand: {
    position: "absolute",
    bottom: 18,
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  handRight: {
    right: -4,
  },
  handLeft: {
    left: -4,
  },
  lane: {
    flex: 1,
    marginHorizontal: 4,
    height: CARD_H + 24,
    justifyContent: "center",
  },
  cardSlot: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -CARD_H / 2,
    width: CARD_W,
    height: CARD_H,
  },
  miniCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  miniCardInner: {
    flex: 1,
    padding: 5,
  },
  miniCardStripe: {
    height: 5,
    borderRadius: 2,
    marginBottom: 6,
    opacity: 0.9,
  },
  miniCardShine: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: "rgba(26,26,26,0.04)",
  },
  formBlock: {
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  messageCard: {
    backgroundColor: Theme.card,
    borderRadius: 20,
    padding: 20,
    paddingLeft: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Theme.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: Theme.text,
  },
  btnPrimary: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Theme.heroBg,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPressed: { opacity: 0.92 },
  btnGradInner: {
    minHeight: 52,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnTextPrimary: {
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: Theme.sub,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
