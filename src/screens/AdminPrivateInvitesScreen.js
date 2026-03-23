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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function fmtDate(iso) {
  if (!iso) {
    return "—";
  }
  try {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export default function AdminPrivateInvitesScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/admin/private-market-invites?limit=80", {
        token,
      });
      setItems(data.invites || []);
    } catch (e) {
      setError(e.message || t("common.error"));
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isAdmin, t]);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      load();
    }, [isAdmin, load])
  );

  async function createInvite() {
    if (!token) {
      return;
    }
    setCreating(true);
    try {
      const data = await api("/api/admin/private-market-invites", {
        token,
        method: "POST",
        body: { max_redemptions: 1, note: "App" },
      });
      const code = data?.invite?.code;
      await load();
      if (code) {
        Alert.alert(t("admin.invitesCreatedTitle"), code);
      }
    } catch (e) {
      Alert.alert(t("common.error"), e.message || "");
    } finally {
      setCreating(false);
    }
  }

  async function revokeInvite(id) {
    if (!token) {
      return;
    }
    Alert.alert(t("admin.invitesRevokeTitle"), t("admin.invitesRevokeBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("admin.invitesRevokeOk"),
        style: "destructive",
        onPress: async () => {
          setBusyId(id);
          try {
            await api(`/api/admin/private-market-invites/${id}`, {
              token,
              method: "PATCH",
              body: { revoked: true },
            });
            await load();
          } catch (e) {
            Alert.alert(t("common.error"), e.message || "");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  if (!token || !isAdmin) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("admin.forbiddenTitle")}</Text>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("admin.back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <StatusBar style="dark" />
      <View style={[styles.toolbar, { paddingTop: 12 + insets.top }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.toolbarBack}
        >
          <Ionicons name="chevron-back" size={26} color={Theme.text} />
        </Pressable>
        <Text style={styles.toolbarTitle}>{t("admin.invitesTitle")}</Text>
        <View style={{ width: 26 }} />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.createBtn,
          creating && styles.createBtnDisabled,
          pressed && !creating ? styles.createBtnPressed : null,
        ]}
        onPress={createInvite}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color={Theme.onWhite} />
        ) : (
          <View style={styles.createBtnInner}>
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={Theme.onWhite}
              style={styles.createBtnIcon}
            />
            <Text style={styles.createBtnText}>{t("admin.invitesNew")}</Text>
          </View>
        )}
      </Pressable>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.text} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(it) => String(it.id)}
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
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{t("admin.invitesEmpty")}</Text>
          }
          renderItem={({ item }) => {
            const max =
              item.max_redemptions == null ? "∞" : String(item.max_redemptions);
            const revoked = Boolean(item.revoked_at);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{item.code}</Text>
                  {!revoked ? (
                    <Pressable
                      onPress={() => revokeInvite(item.id)}
                      disabled={busyId === item.id}
                      style={styles.revokeBtn}
                    >
                      {busyId === item.id ? (
                        <ActivityIndicator size="small" color={Theme.error} />
                      ) : (
                        <Text style={styles.revokeText}>
                          {t("admin.invitesRevoke")}
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <Text style={styles.revokedPill}>
                      {t("admin.invitesRevoked")}
                    </Text>
                  )}
                </View>
                <Text style={styles.meta}>
                  {t("admin.invitesUses", {
                    n: item.redemption_count,
                    max,
                  })}
                </Text>
                <Text style={styles.metaSmall}>
                  {t("admin.invitesExpires")}: {fmtDate(item.expires_at)}
                </Text>
                {item.note ? (
                  <Text style={styles.metaSmall}>{item.note}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  muted: { color: Theme.muted },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  toolbarBack: { padding: 8 },
  toolbarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: Theme.text,
  },
  createBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnIcon: { marginRight: 8 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: Theme.heroBg,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createBtnDisabled: { opacity: 0.75 },
  createBtnPressed: { opacity: 0.9 },
  createBtnText: { color: Theme.onWhite, fontSize: 16, fontWeight: "700" },
  list: { flex: 1 },
  errorBanner: {
    marginHorizontal: 16,
    color: Theme.error,
    fontSize: 14,
    marginBottom: 8,
  },
  empty: { textAlign: "center", color: Theme.muted, marginTop: 32, fontSize: 15 },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  code: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: Theme.text,
    flex: 1,
  },
  revokeBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  revokeText: { color: Theme.error, fontWeight: "700", fontSize: 14 },
  revokedPill: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.muted,
    textTransform: "uppercase",
  },
  meta: { fontSize: 14, color: Theme.sub, fontWeight: "600" },
  metaSmall: { fontSize: 12, color: Theme.muted, marginTop: 4 },
  back: { marginTop: 16 },
  backText: { color: Theme.heroBg, fontWeight: "700" },
});
