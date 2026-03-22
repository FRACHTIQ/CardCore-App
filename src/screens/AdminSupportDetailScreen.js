import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function AdminSupportDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, isAdmin } = useAuth();
  const ticketId = Number(route.params?.id);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !isAdmin || !Number.isInteger(ticketId) || ticketId < 1) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api(`/api/admin/support/tickets/${ticketId}`, {
        token,
      });
      setTicket(data.ticket);
      setMessages(data.messages || []);
      navigation.setOptions({
        title: data.ticket?.subject || t("support.detailTitle"),
      });
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, ticketId, t, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function sendStaffReply() {
    if (!token || !ticket) {
      return;
    }
    const b = reply.trim();
    if (!b) {
      return;
    }
    setSending(true);
    setError("");
    try {
      const data = await api(`/api/admin/support/tickets/${ticketId}/messages`, {
        token,
        method: "POST",
        body: { body: b },
      });
      setMessages(data.messages || []);
      setReply("");
      setTicket((prev) =>
        prev ? { ...prev, status: "ANSWERED" } : prev
      );
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setSending(false);
    }
  }

  async function setStatus(next) {
    if (!token || !ticket || ticket.status === next) {
      return;
    }
    setStatusBusy(true);
    setError("");
    try {
      const data = await api(`/api/admin/support/tickets/${ticketId}`, {
        token,
        method: "PATCH",
        body: { status: next },
      });
      setTicket((prev) =>
        prev ? { ...prev, status: data.ticket?.status || next } : prev
      );
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setStatusBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("admin.forbiddenSub")}</Text>
      </View>
    );
  }

  if (loading && !ticket) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  const statuses = ["OPEN", "WAITING_STAFF", "ANSWERED", "CLOSED"];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 48}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {ticket ? (
          <Text style={styles.userLine}>
            {t("admin.supportUser")}: {ticket.user_email || "—"}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{t("admin.supportStatus")}</Text>
        <View style={styles.statusRow}>
          {statuses.map((s) => (
            <Pressable
              key={s}
              style={[
                styles.statusChip,
                ticket?.status === s ? styles.statusChipOn : null,
              ]}
              onPress={() => setStatus(s)}
              disabled={statusBusy}
            >
              <Text
                style={[
                  styles.statusChipText,
                  ticket?.status === s ? styles.statusChipTextOn : null,
                ]}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{t("support.messages")}</Text>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.from_user ? styles.bubbleUser : styles.bubbleStaff,
            ]}
          >
            <Text style={styles.bubbleMeta}>
              {m.from_user ? t("support.labelYou") : t("support.labelStaff")}
            </Text>
            <Text style={styles.bubbleBody}>{m.body}</Text>
          </View>
        ))}

        <Text style={styles.label}>{t("admin.supportReplyAsStaff")}</Text>
        <TextInput
          style={styles.input}
          value={reply}
          onChangeText={setReply}
          multiline
          placeholderTextColor={Theme.muted}
        />
        <Pressable
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={sendStaffReply}
          disabled={sending}
        >
          <Text style={styles.sendBtnText}>{t("support.replySend")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted },
  scroll: { padding: 16 },
  userLine: { fontSize: 13, color: Theme.sub, marginBottom: 12 },
  error: { color: Theme.error, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: Theme.muted, marginBottom: 6 },
  section: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  statusChipOn: { backgroundColor: Theme.heroBg, borderColor: Theme.heroBg },
  statusChipText: { fontSize: 11, fontWeight: "600", color: Theme.sub },
  statusChipTextOn: { color: Theme.onWhite },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "92%",
  },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: Theme.soft },
  bubbleStaff: { alignSelf: "flex-start", backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.border },
  bubbleMeta: { fontSize: 11, color: Theme.muted, marginBottom: 4 },
  bubbleBody: { fontSize: 15, color: Theme.text, lineHeight: 21 },
  input: {
    minHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Theme.text,
    backgroundColor: Theme.surface,
    textAlignVertical: "top",
  },
  sendBtn: {
    marginTop: 12,
    backgroundColor: Theme.heroBg,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { color: Theme.onWhite, fontWeight: "700", fontSize: 16 },
});
