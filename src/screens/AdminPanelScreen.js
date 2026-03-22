import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
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

function fmtEur(cents) {
  const n = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPanelScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dash, setDash] = useState(null);

  const load = useCallback(async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/admin/dashboard", { token });
      setDash(data);
    } catch (e) {
      setError(e.message || t("common.error"));
      setDash(null);
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

  if (!token) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Ionicons name="lock-closed-outline" size={48} color={Theme.muted} />
        <Text style={styles.deniedTitle}>{t("admin.forbiddenTitle")}</Text>
        <Text style={styles.deniedSub}>{t("admin.forbiddenSub")}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>{t("admin.back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
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
    >
      <StatusBar style="dark" />
      <Text style={styles.eyebrow}>{t("admin.title")}</Text>
      <Text style={styles.sub}>{t("admin.subtitle")}</Text>

      {loading && !dash ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Theme.text} size="large" />
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {dash ? (
        <View style={styles.grid}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiUsers")}</Text>
            <Text style={styles.kpiVal}>{dash.users_total}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiVerified")}</Text>
            <Text style={styles.kpiVal}>{dash.users_verified}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiActive")}</Text>
            <Text style={styles.kpiVal}>{dash.listings_active}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiSold")}</Text>
            <Text style={styles.kpiVal}>{dash.listings_sold}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiRevenue")}</Text>
            <Text style={styles.kpiVal}>
              {fmtEur(dash.revenue_sold_cents)}
            </Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiSupport")}</Text>
            <Text style={styles.kpiVal}>{dash.support_open}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>{t("admin.kpiReports")}</Text>
            <Text style={styles.kpiVal}>
              {dash.reports_open != null ? dash.reports_open : "—"}
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.supportBtn,
          pressed ? styles.supportBtnPressed : null,
        ]}
        onPress={() => navigation.navigate("AdminReportsList")}
      >
        <Ionicons name="flag-outline" size={22} color={Theme.onWhite} />
        <Text style={styles.supportBtnText}>{t("admin.openReports")}</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.onWhite} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.supportBtn,
          pressed ? styles.supportBtnPressed : null,
        ]}
        onPress={() => navigation.navigate("AdminSupportList")}
      >
        <Ionicons name="chatbubbles-outline" size={22} color={Theme.onWhite} />
        <Text style={styles.supportBtnText}>{t("admin.openSupportTickets")}</Text>
        <Ionicons name="chevron-forward" size={20} color={Theme.onWhite} />
      </Pressable>

      <View style={styles.hintBox}>
        <Ionicons name="desktop-outline" size={20} color={Theme.muted} />
        <Text style={styles.hintText}>{t("admin.webHint")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: {
    flex: 1,
    backgroundColor: Theme.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  muted: { color: Theme.muted, fontSize: 15 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: Theme.sub,
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingBox: { paddingVertical: 32, alignItems: "center" },
  errorText: { color: Theme.error, marginBottom: 12, fontSize: 14 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpi: {
    width: "47%",
    minWidth: 140,
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  kpiVal: { fontSize: 22, fontWeight: "800", color: Theme.text },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.heroBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  supportBtnPressed: { opacity: 0.9 },
  supportBtnText: {
    flex: 1,
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Theme.soft,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  hintText: { flex: 1, fontSize: 13, color: Theme.sub, lineHeight: 19 },
  deniedTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: Theme.text,
    textAlign: "center",
  },
  deniedSub: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Theme.heroBg,
    borderRadius: 999,
  },
  backBtnText: { color: Theme.onWhite, fontWeight: "700", fontSize: 15 },
});
