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
  const v = String(s || "").toLowerCase();
  if (v === "open") {
    return Theme.accentTeal;
  }
  if (v === "reviewed") {
    return Theme.accentGreen;
  }
  return Theme.muted;
}

function fmtTime(iso, locale) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminReportsListScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { token, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);

  const load = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/admin/reports?limit=100", { token });
      setReports(data.reports || []);
    } catch (e) {
      setError(e.message || t("common.error"));
      setReports([]);
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
      {loading && !reports.length ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.text} />
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={reports}
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
            <Text style={styles.muted}>{t("admin.reportsEmpty")}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
            onPress={() =>
              navigation.navigate("AdminReportDetail", { id: item.id })
            }
          >
            <View style={styles.rowTop}>
              <Text style={styles.reason} numberOfLines={2}>
                {item.reason}
              </Text>
              <Text
                style={[styles.badge, { color: statusColor(item.status) }]}
              >
                {String(item.status || "").toLowerCase()}
              </Text>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {t("admin.reportRowReporter")}:{" "}
              {item.reporter_display_name || item.reporter_email || "—"} →{" "}
              {item.reported_display_name || item.reported_email || "—"}
            </Text>
            <Text style={styles.time}>
              {fmtTime(item.created_at, i18n.language)}
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
  reason: { flex: 1, fontSize: 16, fontWeight: "700", color: Theme.text },
  badge: { fontSize: 11, fontWeight: "700", textTransform: "lowercase" },
  meta: { marginTop: 8, fontSize: 13, color: Theme.sub },
  time: { marginTop: 6, fontSize: 12, color: Theme.muted },
});
