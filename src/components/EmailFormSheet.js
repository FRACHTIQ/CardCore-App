import { useEffect, useRef } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AUTH_MODAL_DIM,
  AUTH_SHEET_SURFACE,
  UI_PAGE_GUTTER,
  UI_RADIUS_LG,
} from "../constants/authTheme";

/**
 * Dimmen + Panel von unten. Parent hält `visible` bis `onClose` nach Slide-out aufgerufen wurde.
 */
export function EmailFormSheet({ visible, title, onClose, children }) {
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const offscreen = winH + 48;
  const slide = useRef(new Animated.Value(offscreen)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(offscreen);
    backdrop.setValue(0);
    const id = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(slide, {
          toValue: 0,
          useNativeDriver: true,
          tension: 58,
          friction: 13,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => cancelAnimationFrame(id);
  }, [visible, offscreen, slide, backdrop]);

  function runClose() {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slide, {
        toValue: offscreen,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }

  const bottomPad = Math.max(insets.bottom, 14);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={runClose}
      statusBarTranslucent
    >
      <View style={styles.fill} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.dim, { opacity: backdrop }]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={runClose} />
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: bottomPad,
                maxHeight: winH * 0.92,
                transform: [{ translateY: slide }],
              },
            ]}
          >
            <View style={styles.sheetInner}>
              <View style={styles.grabberWrap}>
                <View style={styles.grabberBar} />
              </View>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable
                  onPress={runClose}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.closeBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color="rgba(30,31,38,0.92)" />
                </Pressable>
              </View>
              <View style={styles.sheetBody}>{children}</View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dim: {
    backgroundColor: AUTH_MODAL_DIM,
  },
  kav: {
    justifyContent: "flex-end",
    width: "100%",
  },
  sheet: {
    backgroundColor: AUTH_SHEET_SURFACE,
    borderTopLeftRadius: UI_RADIUS_LG,
    borderTopRightRadius: UI_RADIUS_LG,
    borderWidth: 0,
    overflow: "hidden",
  },
  sheetInner: {
    paddingHorizontal: UI_PAGE_GUTTER,
    paddingTop: 4,
  },
  grabberWrap: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  grabberBar: {
    width: 48,
    height: 5,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 14,
  },
  sheetTitle: {
    flex: 1,
    color: "rgba(255,255,255,0.96)",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 0,
  },
  closeBtnPressed: {
    opacity: 0.82,
  },
  sheetBody: {
    flexGrow: 0,
  },
});
