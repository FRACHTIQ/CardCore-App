import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { profileInitial } from "../utils/profileInitial";
import { resolveUserAvatarUri } from "../utils/resolveUserAvatarUri";

export default function ProfilePublicViewScreen({ route, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const rawUserId = route.params?.userId;
  const userId =
    rawUserId !== undefined && rawUserId !== null
      ? Number(rawUserId)
      : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(userId) || userId < 1) {
      setError(t("common.error"));
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api(`/api/users/${userId}`);
      setProfile(data.profile);
    } catch (e) {
      setError(e.message || t("common.error"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const scrollContent = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 16) + 24,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.error}>{error || t("profile.notFound")}</Text>
        <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color={Theme.text} />
          <Text style={styles.backText}>{t("profile.back")}</Text>
        </Pressable>
      </View>
    );
  }

  const initial = profileInitial(profile.display_name, null);
  const avatarUri = resolveUserAvatarUri(profile?.avatar_url);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="dark" />
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerEyebrow}>{t("profile.publicUserTitle")}</Text>
          <Text style={styles.headerName} numberOfLines={2}>
            {profile.display_name}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>
            {profile.rating_count > 0 ? profile.rating_avg.toFixed(1) : "—"}
          </Text>
          <Text style={styles.statCaption} numberOfLines={2}>
            {t("profile.rating")}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{profile.active_listings_count}</Text>
          <Text style={styles.statCaption} numberOfLines={2}>
            {t("profile.activeListings")}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{profile.sold_count}</Text>
          <Text style={styles.statCaption} numberOfLines={2}>
            {t("profile.sold")}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="document-text-outline" size={18} color={Theme.text} />
          </View>
          <Text style={styles.cardTitle}>{t("profile.bio")}</Text>
        </View>
        <Text style={styles.publicBio}>{profile.bio || "—"}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.bg,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.heroBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.onWhite,
  },
  headerTextCol: { flex: 1, marginLeft: 14, minWidth: 0 },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerName: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    paddingVertical: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  statCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Theme.line,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.3,
  },
  statCaption: {
    marginTop: 4,
    fontSize: 11,
    color: Theme.muted,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Theme.soft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
  },
  publicBio: {
    fontSize: 16,
    lineHeight: 24,
    color: Theme.text,
  },
  error: { color: Theme.error, marginBottom: 12, textAlign: "center" },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  backText: { color: Theme.text, fontSize: 15, fontWeight: "600", marginLeft: 8 },
});
