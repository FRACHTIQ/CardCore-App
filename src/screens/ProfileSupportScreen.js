import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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

export default function ProfileSupportScreen({ navigation }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setError("");
    try {
      const data = await api("/api/support/tickets", { token });
      setItems(data.tickets || []);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function renderItem({ item }) {
    const preview = item.last_message_preview
      ? String(item.last_message_preview).replace(/\n/g, " ").slice(0, 120)
      : "";
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        onPress={() =>
          navigation.navigate("ProfileSupportDetail", { id: item.id })
        }
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardSubject} numberOfLines={2}>
            {item.subject}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {statusLabel(item.status, t)}
            </Text>
          </View>
        </View>
        {preview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {item.message_count ? `${item.message_count} · ` : ""}
          {new Date(item.updated_at).toLocaleString()}
        </Text>
      </Pressable>
    );
  }

  if (!token) {
    return null;
  }

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <StatusBar style="dark" />
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        contentContainerStyle={
          items.length === 0 ? styles.listEmpty : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.text}
            colors={[Theme.text]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t("support.empty")}</Text>
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed ? styles.fabPressed : null,
        ]}
        onPress={() => navigation.navigate("ProfileSupportNew")}
      >
        <Ionicons name="add" size={26} color={Theme.onWhite} />
        <Text style={styles.fabText}>{t("support.newTicket")}</Text>
      </Pressable>
    </View>
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
  errorBanner: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    color: Theme.error,
    padding: 12,
    fontSize: 14,
  },
  list: { padding: 16, paddingBottom: 100 },
  listEmpty: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
    justifyContent: "center",
  },
  empty: {
    textAlign: "center",
    color: Theme.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    padding: 14,
    marginBottom: 10,
  },
  cardPressed: { opacity: 0.92 },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Theme.text,
  },
  badge: {
    backgroundColor: Theme.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.sub,
  },
  preview: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.sub,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.muted,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.heroBg,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabPressed: { opacity: 0.92 },
  fabText: {
    color: Theme.onWhite,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
});
