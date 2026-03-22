import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";

const REASON_KEYS = ["harassment", "spam", "scam", "other"];

export function ReportUserSheet({
  visible,
  userId,
  token,
  onClose,
  onReported,
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function submit(reasonKey) {
    if (!token || !userId) {
      return;
    }
    setBusy(true);
    try {
      await api(`/api/users/${userId}/report`, {
        token,
        method: "POST",
        body: { reason: reasonKey },
      });
      onReported?.();
      onClose();
      Alert.alert(t("messages.reportSentTitle"), t("messages.reportSentBody"));
    } catch (e) {
      Alert.alert(t("common.error"), e.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>{t("messages.reportChooseReason")}</Text>
          {busy ? (
            <ActivityIndicator color={Theme.text} style={styles.busy} />
          ) : (
            REASON_KEYS.map((key) => (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.reasonRow,
                  pressed ? styles.reasonRowPressed : null,
                ]}
                onPress={() => submit(key)}
              >
                <Text style={styles.reasonText}>
                  {t(`messages.reportReason_${key}`)}
                </Text>
              </Pressable>
            ))
          )}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 12,
  },
  busy: { paddingVertical: 20 },
  reasonRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  reasonRowPressed: { opacity: 0.85 },
  reasonText: { fontSize: 16, color: Theme.text },
  cancelBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600", color: Theme.muted },
});
