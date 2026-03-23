import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../theme";

function estimateSharpness(base64) {
  if (!base64 || base64.length < 512) {
    return 0;
  }
  const max = Math.min(2800, base64.length);
  let sum = 0;
  let sumSq = 0;
  let hf = 0;
  let prev = base64.charCodeAt(0);
  for (let i = 1; i < max; i += 5) {
    const c = base64.charCodeAt(i);
    sum += c;
    sumSq += c * c;
    hf += Math.abs(c - prev);
    prev = c;
  }
  const n = Math.max(1, Math.floor(max / 5));
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  const hfNorm = hf / n;
  return variance * 0.001 + hfNorm * 0.42;
}

export default function InstantScanScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const loopRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [side, setSide] = useState("front");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [busy, setBusy] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [autoMsg, setAutoMsg] = useState("");
  const [stableHits, setStableHits] = useState(0);

  const cardRatio = 63 / 88;
  const hasBoth = Boolean(front && back);
  const nextLabel = side === "front" ? t("createListing.front") : t("createListing.back");
  const preview = useMemo(() => (side === "front" ? front : back), [back, front, side]);

  const clearLoop = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => clearLoop();
    }, [clearLoop])
  );

  const saveCapture = useCallback(
    (asset) => {
      if (!asset?.uri || !asset?.base64) {
        return false;
      }
      const payload = {
        uri: asset.uri,
        base64: asset.base64,
        mime: "image/jpeg",
      };
      if (side === "front") {
        setFront(payload);
        setSide("back");
        setAutoMsg(t("instantScan.backNow"));
      } else {
        setBack(payload);
        setAutoMsg(t("instantScan.done"));
      }
      return true;
    },
    [side, t]
  );

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || busy) {
      return null;
    }
    try {
      setBusy(true);
      const shot = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        base64: true,
        skipProcessing: false,
      });
      return shot;
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const manualCapture = useCallback(async () => {
    const shot = await takePicture();
    if (!shot) {
      return;
    }
    saveCapture(shot);
  }, [saveCapture, takePicture]);

  const startAutoScan = useCallback(() => {
    if (!autoMode || loopRef.current) {
      return;
    }
    setAutoMsg(t("instantScan.autoSearching"));
    setStableHits(0);
    loopRef.current = setInterval(async () => {
      if (busy || !cameraRef.current) {
        return;
      }
      const shot = await takePicture();
      if (!shot?.base64) {
        return;
      }
      const score = estimateSharpness(shot.base64);
      const good = score >= 22;
      setStableHits((prev) => {
        const next = good ? prev + 1 : 0;
        if (good) {
          setAutoMsg(t("instantScan.autoFocusOk"));
        } else {
          setAutoMsg(t("instantScan.autoSearching"));
        }
        if (next >= 2) {
          clearLoop();
          saveCapture(shot);
          return 0;
        }
        return next;
      });
    }, 900);
  }, [autoMode, busy, clearLoop, saveCapture, t, takePicture]);

  useEffect(() => {
    if (!autoMode || preview || hasBoth) {
      clearLoop();
      return;
    }
    startAutoScan();
    return () => clearLoop();
  }, [autoMode, clearLoop, hasBoth, preview, side, startAutoScan]);

  const goToCreate = useCallback(() => {
    if (!hasBoth) {
      Alert.alert("", t("createListing.needBothPhotos"));
      return;
    }
    navigation.navigate("Home", {
      screen: "CreateListing",
      params: {
        scannedFront: front,
        scannedBack: back,
      },
    });
  }, [back, front, hasBoth, navigation, t]);

  const resetCurrentSide = useCallback(() => {
    clearLoop();
    if (side === "front") {
      setFront(null);
    } else {
      setBack(null);
    }
    setAutoMsg("");
    setStableHits(0);
  }, [clearLoop, side]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.permissionTitle}>{t("instantScan.permissionTitle")}</Text>
        <Text style={styles.permissionText}>{t("instantScan.permissionBody")}</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnLabel}>{t("instantScan.grantCamera")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" autofocus="on" />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("instantScan.title")}</Text>
          <Text style={styles.headerSub}>{t("instantScan.step", { side: nextLabel })}</Text>
        </View>

        <View style={styles.frameWrap}>
          <View style={[styles.frame, { aspectRatio: cardRatio }]} />
        </View>

        {preview ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: preview.uri }} style={styles.previewImg} />
            <Pressable style={styles.previewRetake} onPress={resetCurrentSide}>
              <Text style={styles.previewRetakeText}>{t("createListing.retake")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.bottomPanel}>
            <Text style={styles.hintText}>{t("instantScan.hint")}</Text>
            <Text style={styles.autoText}>{autoMsg || t("instantScan.autoIdle")}</Text>
            <View style={styles.controlsRow}>
              <Pressable
                style={[styles.smallBtn, autoMode ? styles.smallBtnActive : null]}
                onPress={() => {
                  clearLoop();
                  const next = !autoMode;
                  setAutoMode(next);
                  setStableHits(0);
                  setAutoMsg(next ? t("instantScan.autoIdle") : "");
                }}
              >
                <Ionicons
                  name={autoMode ? "flash-outline" : "hand-right-outline"}
                  size={18}
                  color={autoMode ? Theme.onWhite : Theme.text}
                />
                <Text style={[styles.smallBtnLabel, autoMode ? styles.smallBtnLabelActive : null]}>
                  {autoMode ? t("instantScan.autoOn") : t("instantScan.autoOff")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.captureBtn}
                onPress={autoMode ? startAutoScan : manualCapture}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="scan-circle-outline" size={28} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.footerActions}>
          <Pressable style={[styles.footerBtn, !hasBoth ? styles.footerBtnDisabled : null]} onPress={goToCreate} disabled={!hasBoth}>
            <Text style={styles.footerBtnText}>{t("instantScan.useForListing")}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: Theme.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: Theme.text,
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    color: Theme.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: Theme.text,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  primaryBtnLabel: { color: Theme.onWhite, fontWeight: "700", fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 24,
  },
  header: { alignItems: "center", marginBottom: 16 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSub: {
    marginTop: 5,
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "600",
  },
  frameWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: "82%",
    maxWidth: 330,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bottomPanel: {
    marginTop: 14,
    alignItems: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  autoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  smallBtn: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallBtnActive: {
    backgroundColor: "rgba(26,26,26,0.8)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  smallBtnLabel: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "700",
    fontSize: 13,
  },
  smallBtnLabelActive: {
    color: "#fff",
  },
  captureBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(0,0,0,0.68)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  previewImg: {
    width: 140,
    aspectRatio: 63 / 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  previewRetake: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  previewRetakeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  footerActions: {
    marginTop: 12,
    alignItems: "center",
  },
  footerBtn: {
    minHeight: 48,
    minWidth: 220,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnDisabled: {
    opacity: 0.45,
  },
  footerBtnText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "800",
  },
});
