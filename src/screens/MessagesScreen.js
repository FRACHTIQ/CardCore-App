import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { profileInitial } from "../utils/profileInitial";
import { getMessageReads, setMessageRead } from "../utils/messageReadState";
import { pickChatImageDataUrl } from "../utils/pickChatImage";

const POLL_CONV_MS = 20000;
const POLL_MSG_MS = 4000;

const QUICK_EMOJIS = [
  "😀",
  "😊",
  "👍",
  "❤️",
  "🔥",
  "✨",
  "🎉",
  "👋",
  "😂",
  "🙏",
  "💪",
  "⭐",
  "📷",
  "✅",
  "❌",
];

function isWelcomeConversation(item) {
  return (
    String(item.listing_player_name || "").trim() === "Willkommen" &&
    String(item.listing_sport || "").trim() === "Support"
  );
}

function isConversationUnread(conv, myUserId, reads) {
  if (!conv.last_message_at || myUserId == null) {
    return false;
  }
  const fromOther =
    conv.last_message_sender_id != null &&
    Number(conv.last_message_sender_id) !== myUserId;
  if (!fromOther) {
    return false;
  }
  const readIso = reads[String(conv.id)];
  if (!readIso) {
    return true;
  }
  return new Date(conv.last_message_at) > new Date(readIso);
}

function countUnreadConversations(conversations, myUserId, reads) {
  if (myUserId == null) {
    return 0;
  }
  let n = 0;
  for (const c of conversations) {
    if (isConversationUnread(c, myUserId, reads)) {
      n++;
    }
  }
  return n;
}

function formatListingPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

function formatMsgClock(iso) {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { token } = useAuth();
  const scrollRef = useRef(null);
  const [myUserId, setMyUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [msgBusy, setMsgBusy] = useState(false);
  const [composeH, setComposeH] = useState(120);
  const [showEmojiRow, setShowEmojiRow] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [readMap, setReadMap] = useState({});

  const relativeTime = useCallback(
    (iso) => {
      if (!iso) {
        return "";
      }
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        return "";
      }
      const diffMs = Date.now() - d.getTime();
      const sec = Math.floor(diffMs / 1000);
      const min = Math.floor(sec / 60);
      const hrs = Math.floor(min / 60);
      const days = Math.floor(hrs / 24);
      if (sec < 45) {
        return t("messages.justNow");
      }
      if (min < 60) {
        return t("messages.minutesAgo", { count: min });
      }
      if (hrs < 24) {
        return t("messages.hoursAgo", { count: hrs });
      }
      if (days < 7) {
        return t("messages.daysAgo", { count: days });
      }
      return d.toLocaleDateString(i18n.language === "de" ? "de-DE" : "en-US", {
        day: "numeric",
        month: "short",
      });
    },
    [t, i18n.language]
  );

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

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setReadMap({});
      return;
    }
    (async () => {
      const r = await getMessageReads();
      if (!cancelled) {
        setReadMap(r);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        return;
      }
      let active = true;
      (async () => {
        const r = await getMessageReads();
        if (active) {
          setReadMap(r);
        }
      })();
      return () => {
        active = false;
      };
    }, [token])
  );

  useEffect(() => {
    if (!token) {
      navigation.setOptions({ tabBarBadge: undefined });
      return;
    }
    const n = countUnreadConversations(conversations, myUserId, readMap);
    navigation.setOptions({
      tabBarBadge: n > 0 ? (n > 99 ? "99+" : String(n)) : undefined,
    });
  }, [token, conversations, myUserId, readMap, navigation]);

  useEffect(() => {
    if (!threadId || !token || myUserId == null) {
      return;
    }
    const c = conversations.find((x) => x.id === threadId);
    if (!c?.last_message_at) {
      return;
    }
    setMessageRead(threadId, c.last_message_at).then(() => {
      setReadMap((prev) => ({
        ...prev,
        [String(threadId)]: c.last_message_at,
      }));
    });
  }, [threadId, conversations, token, myUserId]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      return;
    }
    setError("");
    try {
      const data = await api("/api/conversations", { token });
      setConversations(data.conversations || []);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useLayoutEffect(() => {
    if (threadId) {
      const thread = conversations.find((c) => c.id === threadId);
      const title =
        thread && thread.other_display_name
          ? thread.other_display_name
          : thread?.listing_player_name || t("messages.chatTitle");
      navigation.setOptions({
        title,
        headerLeft: () => (
          <Pressable
            onPress={() => setThreadId(null)}
            style={styles.headerBackBtn}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("messages.backToList")}
          >
            <Ionicons name="chevron-back" size={26} color={Theme.text} />
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({
        title: t("tabs.messages"),
        headerLeft: undefined,
      });
    }
  }, [threadId, conversations, navigation, t]);

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
      const msgs = data.messages || [];
      setMessages(msgs);
      if (threadId && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (last?.created_at) {
          await setMessageRead(threadId, last.created_at);
          setReadMap((prev) => ({
            ...prev,
            [String(threadId)]: last.created_at,
          }));
        }
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    }
  }, [threadId, token, t]);

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

  useEffect(() => {
    setShowEmojiRow(false);
    setPendingImage(null);
  }, [threadId]);

  useEffect(() => {
    const tmo = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(tmo);
  }, [messages, threadId]);

  async function sendMessage() {
    const text = draft.trim();
    const img = pendingImage;
    if ((!text && !img) || !threadId || !token) {
      return;
    }
    setMsgBusy(true);
    try {
      await api(`/api/conversations/${threadId}/messages`, {
        token,
        method: "POST",
        body: {
          body: text,
          ...(img ? { image_url: img } : {}),
        },
      });
      setDraft("");
      setPendingImage(null);
      await loadMessages();
      await loadConversations();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setMsgBusy(false);
    }
  }

  const onAttachFile = useCallback(() => {
    Keyboard.dismiss();
    Alert.alert(t("messages.fileSoonTitle"), t("messages.fileSoonBody"), [
      { text: t("common.ok") },
    ]);
  }, [t]);

  const pickImageForChat = useCallback(async () => {
    Keyboard.dismiss();
    try {
      const dataUrl = await pickChatImageDataUrl();
      if (!dataUrl) {
        return;
      }
      setPendingImage(dataUrl);
    } catch (e) {
      if (e && e.code === "PERMISSION_DENIED") {
        Alert.alert(t("common.error"), t("messages.mediaPermission"));
        return;
      }
      if (e && e.code === "TOO_LARGE") {
        Alert.alert(
          t("messages.imageTooLargeTitle"),
          t("messages.imageTooLargeBody")
        );
        return;
      }
      if (e && e.code === "NO_BASE64") {
        Alert.alert(t("common.error"), t("messages.imageReadError"));
        return;
      }
      Alert.alert(t("common.error"), t("common.error"));
    }
  }, [t]);

  const toggleEmojiRow = useCallback(() => {
    setShowEmojiRow((v) => !v);
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadConversations();
  }

  function previewLine(item) {
    const raw = item.last_message_preview
      ? String(item.last_message_preview).trim()
      : "";
    if (!raw) {
      return null;
    }
    const fromMe =
      myUserId != null &&
      item.last_message_sender_id != null &&
      Number(item.last_message_sender_id) === myUserId;
    const prefix = fromMe ? `${t("messages.youPrefix")} ` : "";
    return `${prefix}${raw}`;
  }

  function renderConv({ item }) {
    const label = item.other_display_name
      ? item.other_display_name
      : t("messages.fallbackName");
    const initial = profileInitial(item.other_display_name, null);
    const when = relativeTime(item.last_message_at || item.updated_at);
    const unread = isConversationUnread(item, myUserId, readMap);
    let listingLine = "";
    if (isWelcomeConversation(item)) {
      listingLine = t("messages.teamWelcomeLine");
    } else if (item.listing_player_name) {
      listingLine = `${item.listing_player_name} · ${formatListingPrice(
        item.listing_price_cents,
        item.listing_currency
      )}`;
    }
    const prev = previewLine(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.convRow,
          unread ? styles.convRowUnread : null,
          pressed ? styles.convRowPressed : null,
        ]}
        onPress={() => setThreadId(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${listingLine}`}
      >
        <View style={styles.convAvatarWrap}>
          <View style={[styles.convAvatar, unread ? styles.convAvatarUnread : null]}>
            <Text style={styles.convAvatarText}>{initial}</Text>
          </View>
          {unread ? <View style={styles.unreadPill} /> : null}
        </View>
        <View style={styles.convMid}>
          <View style={styles.convTopRow}>
            <Text
              style={[styles.convTitle, unread ? styles.convTitleUnread : null]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {when ? <Text style={styles.convTime}>{when}</Text> : null}
          </View>
          {listingLine ? (
            <Text style={styles.convListing} numberOfLines={1}>
              {listingLine}
            </Text>
          ) : null}
          {prev ? (
            <Text style={styles.convPreview} numberOfLines={2}>
              {prev}
            </Text>
          ) : (
            <Text style={styles.convPreviewMuted} numberOfLines={1}>
              {t("messages.noMessagesYet")}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Theme.muted} />
      </Pressable>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Ionicons name="chatbubbles-outline" size={48} color={Theme.muted} />
        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>
      </View>
    );
  }

  if (threadId) {
    const activeConv = conversations.find((c) => c.id === threadId);
    let listingHint = "";
    if (activeConv) {
      if (isWelcomeConversation(activeConv)) {
        listingHint = t("messages.teamWelcomeThread");
      } else if (activeConv.listing_player_name) {
        listingHint = `${activeConv.listing_player_name} · ${formatListingPrice(
          activeConv.listing_price_cents,
          activeConv.listing_currency
        )}`;
      }
    }

    /** Tab-Szene endet oberhalb der Tab-Bar — kein großes Home-Indicator-Padding doppelt. */
    const composeBottomPad =
      Platform.OS === "ios" ? 6 : Math.max(Number(insets.bottom) || 0, 10);

    return (
      <KeyboardAvoidingView
        style={styles.threadRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <StatusBar style="dark" />
        {listingHint ? (
          <View style={styles.threadBanner}>
            <Ionicons name="pricetag-outline" size={16} color={Theme.sub} />
            <Text style={styles.threadBannerText} numberOfLines={1}>
              {listingHint}
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
        <View style={styles.threadBody}>
          <ScrollView
            ref={scrollRef}
            style={styles.msgScroll}
            contentContainerStyle={[
              styles.msgContent,
              { paddingBottom: 12 + composeH },
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: false })
            }
          >
            {messages.map((m) => {
              const mine = myUserId !== null && m.sender_id === myUserId;
              return (
                <View
                  key={String(m.id)}
                  style={[
                    styles.bubbleRow,
                    mine ? styles.bubbleRowMine : styles.bubbleRowOther,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.bubbleMine : styles.bubbleOther,
                    ]}
                  >
                    {m.image_url ? (
                      <Image
                        source={{ uri: m.image_url }}
                        style={styles.bubbleImage}
                        resizeMode="cover"
                        accessibilityIgnoresInvertColors
                      />
                    ) : null}
                    {m.body ? (
                      <Text
                        style={[
                          styles.bubbleText,
                          mine ? styles.bubbleTextMine : styles.bubbleTextOther,
                        ]}
                      >
                        {m.body}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.bubbleTime,
                        mine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
                      ]}
                    >
                      {formatMsgClock(m.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View
            onLayout={(e) =>
              setComposeH(Math.ceil(e.nativeEvent.layout.height))
            }
            style={[styles.compose, { paddingBottom: composeBottomPad }]}
          >
            {pendingImage ? (
              <View style={styles.pendingImageRow}>
                <Image
                  source={{ uri: pendingImage }}
                  style={styles.pendingThumb}
                  resizeMode="cover"
                />
                <View style={styles.pendingImageMeta}>
                  <Text style={styles.pendingImageLabel} numberOfLines={1}>
                    {t("messages.pendingImageLabel")}
                  </Text>
                  <Pressable
                    onPress={() => setPendingImage(null)}
                    style={({ pressed }) => [
                      styles.pendingRemove,
                      pressed ? styles.pendingRemovePressed : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t("messages.removeImage")}
                  >
                    <Ionicons name="close-circle" size={22} color={Theme.muted} />
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={styles.composeInputRow}>
              <View style={styles.composeLeading}>
                <Pressable
                  style={({ pressed }) => [
                    styles.composeIconBtn,
                    pressed ? styles.composeIconBtnPressed : null,
                  ]}
                  onPress={onAttachFile}
                  accessibilityRole="button"
                  accessibilityLabel={t("messages.a11yAttachFile")}
                >
                  <Ionicons
                    name="attach-outline"
                    size={24}
                    color={Theme.sub}
                  />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.composeIconBtn,
                    pressed ? styles.composeIconBtnPressed : null,
                  ]}
                  onPress={pickImageForChat}
                  accessibilityRole="button"
                  accessibilityLabel={t("messages.a11yAttachImage")}
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={Theme.sub}
                  />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.composeIconBtn,
                    showEmojiRow ? styles.composeIconBtnActive : null,
                    pressed ? styles.composeIconBtnPressed : null,
                  ]}
                  onPress={toggleEmojiRow}
                  accessibilityRole="button"
                  accessibilityLabel={t("messages.a11yEmoji")}
                >
                  <Ionicons
                    name="happy-outline"
                    size={24}
                    color={showEmojiRow ? Theme.heroBg : Theme.sub}
                  />
                </Pressable>
              </View>
              <TextInput
                style={styles.inputInline}
                value={draft}
                onChangeText={setDraft}
                placeholder={t("messages.placeholder")}
                placeholderTextColor={Theme.muted}
                multiline
                maxLength={8000}
              />
              {msgBusy ? (
                <ActivityIndicator color={Theme.text} style={styles.sendSlot} />
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.sendFab,
                    pressed ? styles.sendFabPressed : null,
                    !draft.trim() && !pendingImage ? styles.sendFabDisabled : null,
                  ]}
                  onPress={sendMessage}
                  disabled={(!draft.trim() && !pendingImage) || msgBusy}
                  accessibilityRole="button"
                  accessibilityLabel={t("messages.send")}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={
                      draft.trim() || pendingImage ? Theme.onWhite : Theme.muted
                    }
                  />
                </Pressable>
              )}
            </View>
            {showEmojiRow ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.emojiBarContent}
                style={styles.emojiBar}
              >
                {QUICK_EMOJIS.map((em) => (
                  <Pressable
                    key={em}
                    style={({ pressed }) => [
                      styles.emojiChip,
                      pressed ? styles.emojiChipPressed : null,
                    ]}
                    onPress={() =>
                      setDraft((prev) => (prev.length >= 8000 ? prev : prev + em))
                    }
                  >
                    <Text style={styles.emojiChipText}>{em}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const unreadTotal = countUnreadConversations(conversations, myUserId, readMap);

  return (
    <View style={styles.wrap}>
      <StatusBar style="dark" />
      {loading ? (
        <ActivityIndicator color={Theme.text} style={styles.centered} />
      ) : null}
      {!loading && error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      {!loading && !error ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConv}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.text}
              colors={[Theme.text]}
            />
          }
          ListHeaderComponent={
            <View>
              {unreadTotal > 0 ? (
                <View style={styles.unreadBanner} accessibilityRole="text">
                  <Ionicons name="mail-unread-outline" size={20} color={Theme.heroBg} />
                  <Text style={styles.unreadBannerText}>
                    {t("messages.unreadBanner", { count: unreadTotal })}
                  </Text>
                </View>
              ) : null}
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                  {t("messages.centerTitle")}
                </Text>
                <Text style={styles.listHeaderSub}>{t("messages.centerSub")}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBlock}>
              <Ionicons
                name="chatbubbles-outline"
                size={56}
                color={Theme.muted}
              />
              <Text style={styles.emptyTitle}>{t("messages.emptyTitle")}</Text>
              <Text style={styles.empty}>{t("messages.empty")}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  centered: { marginTop: 24 },
  error: { paddingHorizontal: 16, paddingTop: 8, color: Theme.error },
  errorBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: Theme.error,
    fontSize: 13,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  listHeader: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  listHeaderTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.3,
  },
  listHeaderSub: {
    fontSize: 14,
    color: Theme.sub,
    marginTop: 6,
    lineHeight: 20,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  unreadBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Theme.text,
    lineHeight: 20,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  convRowPressed: { opacity: 0.92 },
  convRowUnread: {
    borderColor: "rgba(59, 130, 246, 0.35)",
    backgroundColor: "rgba(59, 130, 246, 0.07)",
  },
  convAvatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  unreadPill: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.heroBg,
    borderWidth: 2,
    borderColor: Theme.surface,
  },
  convAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  convAvatarUnread: {
    borderWidth: 2,
    borderColor: "rgba(26,26,26,0.08)",
  },
  convTitleUnread: {
    fontWeight: "800",
  },
  convAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.text,
  },
  convMid: { flex: 1, minWidth: 0 },
  convTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  convTitle: { fontSize: 16, fontWeight: "700", color: Theme.text, flex: 1 },
  convTime: {
    fontSize: 12,
    color: Theme.muted,
    fontVariant: ["tabular-nums"],
  },
  convListing: {
    fontSize: 13,
    color: Theme.sub,
    fontWeight: "600",
    marginTop: 4,
  },
  convPreview: {
    fontSize: 14,
    color: Theme.text,
    marginTop: 6,
    lineHeight: 19,
  },
  convPreviewMuted: {
    fontSize: 13,
    color: Theme.muted,
    marginTop: 6,
    fontStyle: "italic",
  },
  emptyBlock: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.text,
    marginTop: 16,
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    color: Theme.muted,
    marginTop: 8,
    lineHeight: 22,
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.bg,
    paddingHorizontal: 24,
    gap: 12,
  },
  muted: { color: Theme.muted, textAlign: "center", fontSize: 15 },
  headerBackBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginLeft: 4,
  },
  threadRoot: { flex: 1, backgroundColor: Theme.bg },
  /** Scroll + Eingabe gemeinsam füllen, Leiste sitzt unten am Inhaltsbereich (über Tab-Bar). */
  threadBody: {
    flex: 1,
    minHeight: 0,
  },
  threadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Theme.soft,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  threadBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Theme.sub,
  },
  msgScroll: { flex: 1 },
  msgContent: { padding: 16, paddingBottom: 24 },
  bubbleRow: {
    marginBottom: 10,
    flexDirection: "row",
  },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: Theme.heroBg,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  bubbleTextMine: { color: Theme.onWhite },
  bubbleTextOther: { color: Theme.text },
  bubbleTime: { fontSize: 11, marginTop: 6, fontVariant: ["tabular-nums"] },
  bubbleTimeMine: { color: "rgba(255,255,255,0.65)", alignSelf: "flex-end" },
  bubbleTimeOther: { color: Theme.muted, alignSelf: "flex-end" },
  bubbleImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Theme.soft,
  },
  pendingImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pendingThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Theme.soft,
  },
  pendingImageMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 0,
  },
  pendingImageLabel: {
    flex: 1,
    fontSize: 13,
    color: Theme.sub,
    marginRight: 8,
  },
  pendingRemove: { padding: 4 },
  pendingRemovePressed: { opacity: 0.75 },
  compose: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.line,
    paddingHorizontal: 6,
    paddingTop: 8,
    backgroundColor: Theme.surface,
  },
  composeInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  composeLeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexShrink: 0,
    paddingBottom: 2,
  },
  composeIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  composeIconBtnPressed: { opacity: 0.75 },
  composeIconBtnActive: {
    backgroundColor: Theme.soft,
  },
  inputInline: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 16,
    lineHeight: 22,
    color: Theme.text,
    backgroundColor: Theme.bg,
  },
  sendSlot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBar: {
    marginTop: 6,
    maxHeight: 48,
  },
  emojiBarContent: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  emojiChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Theme.soft,
  },
  emojiChipPressed: { opacity: 0.85 },
  emojiChipText: { fontSize: 26, lineHeight: 32 },
  sendFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.heroBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendFabPressed: { opacity: 0.9 },
  sendFabDisabled: { backgroundColor: Theme.soft },
});
