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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function statusLabel(status, t) {
  const map = {
    OPEN: "support.statusOPEN",
    WAITING_STAFF: "support.statusWAITING_STAFF",
    ANSWERED: "support.statusANSWERED",
    CLOSED: "support.statusCLOSED",
  };
  const key = map[status];
  return key ? t(key) : status;
}

export default function SupportTicketDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const ticketId = Number(route.params?.id);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!token || !Number.isInteger(ticketId) || ticketId < 1) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api(`/api/support/tickets/${ticketId}`, { token });
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
  }, [token, ticketId, t, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function sendReply() {
    if (!token || !ticket) {
      return;
    }
    if (ticket.status === "CLOSED") {
      return;
    }
    const b = reply.trim();
    if (!b) {
      return;
    }
    setSending(true);
    setError("");
    try {
      const data = await api(`/api/support/tickets/${ticketId}/messages`, {
        token,
        method: "POST",
        body: { body: b },
      });
      setMessages(data.messages || []);
      setReply("");
      setTicket((prev) =>
        prev ? { ...prev, status: "WAITING_STAFF", updated_at: new Date().toISOString() } : prev
      );
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return null;
  }

  if (loading && !ticket) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  const closed = ticket?.status === "CLOSED";

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 12) + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        {ticket ? (
          <View style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={styles.subject}>{ticket.subject}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {statusLabel(ticket.status, t)}
                </Text>
              </View>
            </View>
            <Text style={styles.date}>
              {new Date(ticket.created_at).toLocaleString()}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t("support.messages")}</Text>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubbleWrap,
              m.from_user ? styles.bubbleUser : styles.bubbleStaff,
            ]}
          >
            <Text style={styles.bubbleMeta}>
              {m.from_user ? t("support.labelYou") : t("support.labelStaff")}{" "}
              · {new Date(m.created_at).toLocaleString()}
            </Text>
            <Text style={styles.bubbleBody}>{m.body}</Text>
          </View>
        ))}

        {closed ? (
          <Text style={styles.closedHint}>{t("support.closedHint")}</Text>
        ) : null}
      </ScrollView>

      {!closed ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <TextInput
            style={styles.replyInput}
            value={reply}
            onChangeText={setReply}
            placeholder={t("support.replyPlaceholder")}
            placeholderTextColor={Theme.muted}
            multiline
            editable={!sending}
          />
          {sending ? (
            <ActivityIndicator color={Theme.text} />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                pressed ? styles.sendBtnPressed : null,
              ]}
              onPress={sendReply}
            >
              <Ionicons name="send" size={18} color={Theme.onWhite} />
              <Text style={styles.sendBtnText}>{t("support.replySend")}</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.bg,
  },
  scroll: { padding: 16, paddingTop: 8 },
  errorBanner: {
    color: Theme.error,
    marginBottom: 12,
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    padding: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  subject: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: Theme.text,
  },
  badge: {
    backgroundColor: Theme.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: Theme.sub },
  date: { marginTop: 8, fontSize: 12, color: Theme.muted },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  bubbleWrap: {
    maxWidth: "92%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  bubbleStaff: {
    alignSelf: "flex-start",
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  bubbleMeta: { fontSize: 11, color: Theme.muted, marginBottom: 6 },
  bubbleBody: { fontSize: 15, lineHeight: 22, color: Theme.text },
  closedHint: {
    marginTop: 12,
    fontSize: 14,
    color: Theme.muted,
    fontStyle: "italic",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.line,
    backgroundColor: Theme.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  replyInput: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Theme.text,
    marginBottom: 10,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.heroBg,
    borderRadius: 12,
    paddingVertical: 12,
  },
  sendBtnPressed: { opacity: 0.92 },
  sendBtnText: { color: Theme.onWhite, fontWeight: "700", fontSize: 15 },
});
