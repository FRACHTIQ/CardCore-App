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
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function statusColor(s) {
  if (s === "OPEN" || s === "WAITING_STAFF") {
    return Theme.accentTeal;
  }
  if (s === "ANSWERED") {
    return Theme.accentGreen;
  }
  return Theme.muted;
}

export default function AdminSupportListScreen({ navigation }) {
  const { t } = useTranslation();
  const { token, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);

  const load = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/admin/support/tickets?limit=80", { token });
      setTickets(data.tickets || []);
    } catch (e) {
      setError(e.message || t("common.error"));
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isAdmin, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("admin.forbiddenSub")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <StatusBar style="dark" />
      {loading && !tickets.length ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.text} />
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Theme.text}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.muted}>{t("admin.supportEmpty")}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
            onPress={() =>
              navigation.navigate("AdminSupportDetail", { id: item.id })
            }
          >
            <View style={styles.rowTop}>
              <Text style={styles.subj} numberOfLines={2}>
                {item.subject}
              </Text>
              <Text
                style={[styles.badge, { color: statusColor(item.status) }]}
              >
                {item.status}
              </Text>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {item.user_email || "—"}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted, padding: 16 },
  error: { color: Theme.error, padding: 12, fontSize: 14 },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  rowPressed: { opacity: 0.92 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  subj: { flex: 1, fontSize: 16, fontWeight: "700", color: Theme.text },
  badge: { fontSize: 11, fontWeight: "700" },
  meta: { marginTop: 6, fontSize: 13, color: Theme.muted },
});
