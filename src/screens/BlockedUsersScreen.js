import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/users/me/blocked", { token });
      setRows(Array.isArray(data.blocked) ? data.blocked : []);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function confirmUnblock(id, name) {
    Alert.alert(
      t("profile.blockedUsersUnblockTitle"),
      t("profile.blockedUsersUnblockBody", { name: name || "—" }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.blockedUsersUnblock"),
          style: "default",
          onPress: () => doUnblock(id),
        },
      ]
    );
  }

  async function doUnblock(id) {
    if (!token) {
      return;
    }
    setBusyId(id);
    try {
      await api(`/api/users/${id}/block`, { token, method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      Alert.alert(t("common.error"), e.message || t("common.error"));
    } finally {
      setBusyId(null);
    }
  }

  function renderItem({ item }) {
    const busy = busyId === item.id;
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.name} numberOfLines={2}>
            {item.display_name || "—"}
          </Text>
          <Text style={styles.meta}>ID {item.id}</Text>
        </View>
        <Pressable
          onPress={() => confirmUnblock(item.id, item.display_name)}
          disabled={busy}
          style={({ pressed }) => [
            styles.unblockBtn,
            pressed ? styles.unblockBtnPressed : null,
            busy ? styles.unblockBtnDisabled : null,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Theme.text} />
          ) : (
            <>
              <Ionicons name="lock-open-outline" size={18} color={Theme.text} />
              <Text style={styles.unblockLabel}>
                {t("profile.blockedUsersUnblock")}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>
      </View>
    );
  }

  if (loading && rows.length === 0 && !error) {
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error ? (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.text}
              colors={[Theme.text]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t("profile.blockedUsersEmpty")}</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted },
  error: { padding: 16, color: Theme.error },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowText: { flex: 1, minWidth: 0, marginRight: 12 },
  name: { fontSize: 16, fontWeight: "700", color: Theme.text },
  meta: { fontSize: 12, color: Theme.muted, marginTop: 4 },
  unblockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    backgroundColor: Theme.soft,
  },
  unblockBtnPressed: { opacity: 0.88 },
  unblockBtnDisabled: { opacity: 0.6 },
  unblockLabel: { fontSize: 14, fontWeight: "700", color: Theme.text },
  empty: { textAlign: "center", color: Theme.muted, marginTop: 32 },
});
