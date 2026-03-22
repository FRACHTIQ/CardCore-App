import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const STATUSES = ["open", "reviewed", "dismissed"];

export default function AdminReportDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, isAdmin } = useAuth();
  const reportId = Number(route.params?.id);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !isAdmin || !Number.isInteger(reportId) || reportId < 1) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api(`/api/admin/reports/${reportId}`, { token });
      setReport(data.report);
      navigation.setOptions({
        title: t("admin.reportDetailTitle", { id: reportId }),
      });
    } catch (e) {
      setError(e.message || t("common.error"));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, reportId, t, navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function setStatus(next) {
    if (!token || !report) {
      return;
    }
    const cur = String(report.status || "").toLowerCase();
    if (cur === next) {
      return;
    }
    setStatusBusy(true);
    setError("");
    try {
      const data = await api(`/api/admin/reports/${reportId}`, {
        token,
        method: "PATCH",
        body: { status: next },
      });
      setReport((prev) =>
        prev ? { ...prev, status: data.report?.status || next } : prev
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

  if (loading && !report) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
    >
      <StatusBar style="dark" />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {report ? (
        <>
          <Text style={styles.label}>{t("admin.reportStatus")}</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusChip,
                  String(report.status || "").toLowerCase() === s
                    ? styles.statusChipOn
                    : null,
                ]}
                onPress={() => setStatus(s)}
                disabled={statusBusy}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    String(report.status || "").toLowerCase() === s
                      ? styles.statusChipTextOn
                      : null,
                  ]}
                >
                  {t(`admin.reportStatus_${s}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>{t("admin.reportReason")}</Text>
          <Text style={styles.body}>{report.reason}</Text>

          {report.details ? (
            <>
              <Text style={styles.section}>{t("admin.reportDetails")}</Text>
              <Text style={styles.body}>{report.details}</Text>
            </>
          ) : null}

          <Text style={styles.section}>{t("admin.reportReporter")}</Text>
          <Text style={styles.body}>
            {report.reporter_display_name || "—"}{" "}
            <Text style={styles.dim}>
              ({report.reporter_email || "—"}) · ID {report.reporter_id}
            </Text>
          </Text>

          <Text style={styles.section}>{t("admin.reportReportedUser")}</Text>
          <Text style={styles.body}>
            {report.reported_display_name || "—"}{" "}
            <Text style={styles.dim}>
              ({report.reported_email || "—"}) · ID {report.reported_id}
            </Text>
          </Text>

          <Text style={styles.meta}>
            {t("admin.reportCreated")}: {String(report.created_at || "—")}
          </Text>
        </>
      ) : (
        <Text style={styles.muted}>{t("admin.reportNotFound")}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted, padding: 16 },
  error: { color: Theme.error, marginBottom: 12, fontSize: 14 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  section: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: "800",
    color: Theme.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  body: { fontSize: 16, color: Theme.text, lineHeight: 24 },
  dim: { fontSize: 14, color: Theme.sub },
  meta: { marginTop: 20, fontSize: 12, color: Theme.muted },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  statusChipOn: {
    backgroundColor: Theme.heroBg,
    borderColor: Theme.heroBg,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.text,
    textTransform: "capitalize",
  },
  statusChipTextOn: { color: Theme.onWhite },
});
