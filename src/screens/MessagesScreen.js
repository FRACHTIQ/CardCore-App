import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIMARY } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const POLL_CONV_MS = 20000;
const POLL_MSG_MS = 4000;

export default function MessagesScreen({ navigation, route }) {
  const { token } = useAuth();
  const [myUserId, setMyUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);

  useEffect(() => {
    const p = route.params;
    const cid = p && p.conversationId ? p.conversationId : null;
    if (cid) {
      setThreadId(cid);
      navigation.setParams({ conversationId: undefined });
    }
  }, [route.params, navigation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        return;
      }
      try {
        const data = await api("/api/users/me", { token });
        if (!cancelled) {
          setMyUserId(data.user.id);
        }
      } catch {
        if (!cancelled) {
          setMyUserId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      return;
    }
    setError("");
    try {
      const data = await api("/api/conversations", { token });
      setConversations(data.conversations || []);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const id = setInterval(() => {
      loadConversations();
    }, POLL_CONV_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!token || !threadId) {
      return;
    }
    try {
      const data = await api(
        `/api/conversations/${threadId}/messages?limit=100`,
        { token }
      );
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message || "Fehler");
    }
  }, [threadId, token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!threadId) {
      return;
    }
    const id = setInterval(() => {
      loadMessages();
    }, POLL_MSG_MS);
    return () => clearInterval(id);
  }, [threadId, loadMessages]);

  async function sendMessage() {
    const t = draft.trim();
    if (!t || !threadId || !token) {
      return;
    }
    setMsgBusy(true);
    try {
      await api(`/api/conversations/${threadId}/messages`, {
        token,
        method: "POST",
        body: { body: t },
      });
      setDraft("");
      await loadMessages();
      await loadConversations();
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setMsgBusy(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadConversations();
  }

  function renderConv({ item }) {
    const label = item.other_display_name
      ? item.other_display_name
      : "Gespräch";
    const sub = item.listing_player_name
      ? `${item.listing_player_name}`
      : "";
    return (
      <Pressable
        style={styles.convRow}
        onPress={() => setThreadId(item.id)}
      >
        <Text style={styles.convTitle}>{label}</Text>
        {sub ? <Text style={styles.convSub}>{sub}</Text> : null}
      </Pressable>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Bitte anmelden.</Text>
      </View>
    );
  }

  if (threadId) {
    const thread = conversations.find((c) => c.id === threadId);
    const title = thread && thread.listing_player_name
      ? thread.listing_player_name
      : "Chat";

    return (
      <View style={styles.threadWrap}>
        <View style={styles.threadHeader}>
          <Pressable onPress={() => setThreadId(null)}>
            <Text style={styles.back}>Zurück</Text>
          </Pressable>
          <Text style={styles.threadTitle}>{title}</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ScrollView
          style={styles.msgScroll}
          contentContainerStyle={styles.msgContent}
        >
          {messages.map((m) => {
            const mine = myUserId !== null && m.sender_id === myUserId;
            const who = mine ? "Du" : "Partner";
            return (
              <View key={String(m.id)} style={styles.msgRow}>
                <Text style={styles.msgMeta}>{who}</Text>
                <Text style={styles.msgBody}>{m.body}</Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.compose}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Nachricht"
            placeholderTextColor="#999"
            multiline
          />
          {msgBusy ? (
            <ActivityIndicator color={PRIMARY} style={styles.spinner} />
          ) : null}
          {!msgBusy ? (
            <Pressable style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendBtnText}>Senden</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>Nachrichten</Text>
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={styles.centered} />
      ) : null}
      {!loading ? (
        error ? <Text style={styles.error}>{error}</Text> : null
      ) : null}
      {!loading ? (
        error ? null : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderConv}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Noch keine Gespräche.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fafafa" },
  head: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 16,
    color: "#111",
  },
  centered: { marginTop: 24 },
  error: { padding: 16, color: "#a00" },
  listContent: { padding: 16, paddingBottom: 32 },
  convRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  convTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  convSub: { fontSize: 14, color: "#666", marginTop: 4 },
  empty: { textAlign: "center", color: "#888", marginTop: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#888" },
  threadWrap: { flex: 1, backgroundColor: "#fff" },
  threadHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  back: { color: PRIMARY, fontSize: 15, marginBottom: 8 },
  threadTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  msgScroll: { flex: 1 },
  msgContent: { padding: 16 },
  msgRow: { marginBottom: 14 },
  msgMeta: { fontSize: 12, color: "#888", marginBottom: 4 },
  msgBody: { fontSize: 16, color: "#222" },
  compose: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 12,
    paddingBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    fontSize: 16,
    color: "#111",
  },
  spinner: { marginVertical: 8 },
  sendBtn: {
    alignSelf: "flex-end",
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  sendBtnText: { color: "#fff", fontWeight: "600" },
});
