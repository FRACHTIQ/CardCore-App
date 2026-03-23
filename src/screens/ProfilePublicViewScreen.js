import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking as openExternal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { HeaderBackButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api, getSellerReviews } from "../api";
import { useAuth } from "../AuthContext";
import { ReportUserSheet } from "../components/ReportUserSheet";
import { TeamAdminBadge } from "../components/TeamAdminBadge";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { profileInitial } from "../utils/profileInitial";
import { resolveUserAvatarUri } from "../utils/resolveUserAvatarUri";
import { formatProfilePresence } from "../utils/formatPresence";
import { SOCIAL_PLATFORM_ORDER } from "../utils/socialPlatforms";

export default function ProfilePublicViewScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const rawUserId = route.params?.userId;
  const userId =
    rawUserId !== undefined && rawUserId !== null
      ? Number(rawUserId)
      : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setMyUserId(null);
      return;
    }
    (async () => {
      try {
        const data = await api("/api/users/me", { token });
        if (!cancelled && data?.user?.id != null) {
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

  const load = useCallback(
    async (opts = { silent: false }) => {
      const silent = Boolean(opts && opts.silent);
      if (!Number.isInteger(userId) || userId < 1) {
        setError(t("common.error"));
        if (!silent) {
          setLoading(false);
        }
        return;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const data = await api(`/api/users/${userId}`, token ? { token } : {});
        setProfile(data.profile);
        let revs = [];
        if (data.profile && Number(data.profile.rating_count) > 0) {
          try {
            const r = await getSellerReviews(userId, 3);
            revs = Array.isArray(r.reviews) ? r.reviews : [];
          } catch {
            revs = [];
          }
        }
        setReviews(revs);
      } catch (e) {
        setError(e.message || t("common.error"));
        setProfile(null);
        setReviews([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [userId, t, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  /** Von anderem Tab / verschachtelt geöffnet: Stack kann nur diese Screen haben → goBack() geht nicht. */
  const goBackFromPreview = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "ProfileHub" }],
      })
    );
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: (props) => (
        <HeaderBackButton
          {...props}
          onPress={goBackFromPreview}
        />
      ),
    });
  }, [navigation, goBackFromPreview]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBackFromPreview();
        return true;
      });
      return () => sub.remove();
    }, [goBackFromPreview])
  );

  /** Tab-Bar + zusätzlicher Abstand, damit Bio/Safety nicht unter der Leiste klemmen */
  const scrollContent = {
    paddingBottom: insets.bottom + 72,
    flexGrow: 1,
  };

  if (loading && !profile) {
    return (
      <View style={styles.screenRoot}>
        <StatusBar style="dark" />
        <View style={styles.skeletonScene}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={styles.skeletonLineSm} />
            <View style={styles.skeletonLineLg} />
          </View>
        </View>
        <View style={styles.skeletonSheet}>
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonBar} />
          <View style={[styles.skeletonBar, { width: "70%" }]} />
        </View>
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
  const isSelf = myUserId != null && myUserId === userId;
  const responseSamples = Number(profile.response_metric_samples) || 0;
  const avgResponseH =
    profile.avg_response_hours != null && !Number.isNaN(Number(profile.avg_response_hours))
      ? Number(profile.avg_response_hours)
      : null;
  const showResponseMetric = responseSamples > 0 && avgResponseH != null;
  const showSafety =
    token && myUserId != null && !isSelf && Number.isInteger(userId);

  async function toggleBlock() {
    if (!token || !showSafety) {
      return;
    }
    const blocking = !profile.viewer_has_blocked;
    const title = blocking
      ? t("profile.blockConfirmTitle")
      : t("profile.unblockConfirmTitle");
    const body = blocking
      ? t("profile.blockConfirmBody")
      : t("profile.unblockConfirmBody");
    Alert.alert(title, body, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: blocking ? t("profile.blockConfirmOk") : t("profile.unblockConfirmOk"),
        style: blocking ? "destructive" : "default",
        onPress: async () => {
          setBlockBusy(true);
          try {
            if (blocking) {
              await api(`/api/users/${userId}/block`, {
                token,
                method: "POST",
              });
            } else {
              await api(`/api/users/${userId}/block`, {
                token,
                method: "DELETE",
              });
            }
            await load({ silent: true });
          } catch (e) {
            Alert.alert(t("common.error"), e.message || t("common.error"));
          } finally {
            setBlockBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.screenRoot}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.text} />
        }
      >
        {/* 1) Cinematic scene — zentriertes Profil (eine Spalte, ruhige Hierarchie) */}
        <View style={styles.cinemaScene}>
          <LinearGradient
            colors={["#030303", "#121211", "#1c1c19", "#252522"]}
            locations={[0, 0.35, 0.72, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "transparent"]}
            style={styles.cinemaVignetteTop}
            pointerEvents="none"
          />
          <View style={styles.cinemaSceneInner}>
            <View style={styles.cinemaHeroColumn}>
              <View
                style={[
                  styles.avatarPresenceRing,
                  profile.is_online
                    ? styles.avatarPresenceRingOnline
                    : styles.avatarPresenceRingAway,
                ]}
              >
                <View style={styles.cinemaAvatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.cinemaAvatarImg} />
                  ) : (
                    <Text style={styles.cinemaAvatarLetter}>{initial}</Text>
                  )}
                </View>
              </View>
              {profile.is_online ? (
                <View
                  style={styles.heroOnlineCentered}
                  accessibilityLabel={t("profile.presenceOnline")}
                >
                  <View style={styles.heroOnlineDot} />
                  <Text style={styles.heroOnlineTxt}>{t("profile.presenceOnline")}</Text>
                </View>
              ) : null}
              <Text style={styles.cinemaRoleLineCentered}>{t("profile.publicUserTitle")}</Text>
              <Text style={styles.cinemaHeadlineCentered} numberOfLines={3}>
                {profile.display_name}
              </Text>
              {profile.is_verified || profile.is_admin ? (
                <View style={styles.cinemaBadgeStripCentered}>
                  {profile.is_verified ? <VerifiedBadge /> : null}
                  {profile.is_admin ? <TeamAdminBadge compact /> : null}
                </View>
              ) : null}
              {!profile.is_online ? (
                <Text style={styles.heroPresenceCentered} numberOfLines={2}>
                  {formatProfilePresence(
                    t,
                    profile.last_seen_at,
                    profile.is_online,
                    i18n.language
                  )}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* 2) Light “projection” sheet — content rolls in from below */}
        <View style={styles.lightSheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetSceneLabel}>{t("profile.publicSceneStats")}</Text>
          <View style={styles.kpiCard}>
            <View style={styles.statsFilmstrip}>
              <View style={styles.statFrame}>
                <Text style={styles.statFigure}>
                  {profile.rating_count > 0 ? profile.rating_avg.toFixed(1) : "—"}
                </Text>
                <Text style={styles.statRole} numberOfLines={2}>
                  {t("profile.rating")}
                </Text>
              </View>
              <View style={styles.statSprocket} />
              <View style={styles.statFrame}>
                <Text style={styles.statFigure}>{profile.active_listings_count}</Text>
                <Text style={styles.statRole} numberOfLines={2}>
                  {t("profile.activeListings")}
                </Text>
              </View>
              <View style={styles.statSprocket} />
              <View style={styles.statFrame}>
                <Text style={styles.statFigure}>{profile.sold_count}</Text>
                <Text style={styles.statRole} numberOfLines={2}>
                  {t("profile.sold")}
                </Text>
              </View>
            </View>
            {showResponseMetric ? (
              <>
                <View style={styles.kpiDivider} />
                <View style={styles.kpiTrustBlock}>
                  <Text style={styles.kpiTrustKicker}>{t("profile.trustTitleShort")}</Text>
                  <Text style={styles.kpiTrustLine}>
                    {t("profile.responseTimeLine", {
                      hours:
                        avgResponseH < 100
                          ? String(Math.round(avgResponseH * 10) / 10).replace(/\.0$/, "")
                          : String(Math.round(avgResponseH)),
                    })}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {Array.isArray(profile.social_links) && profile.social_links.length > 0 ? (
            <View style={styles.socialDock}>
              <Text style={styles.sheetSceneLabel}>{t("profile.publicSceneLinks")}</Text>
              <View style={styles.socialDockRow}>
                {profile.social_links.map((item) => {
                  const meta = SOCIAL_PLATFORM_ORDER.find((p) => p.id === item.platform);
                  const icon = meta?.icon || "link-outline";
                  const labelKey = `profile.social_${item.platform}`;
                  return (
                    <Pressable
                      key={`${item.platform}-${item.url}`}
                      style={({ pressed }) => [
                        styles.socialDockBtn,
                        pressed ? styles.socialDockBtnPressed : null,
                      ]}
                      onPress={() => openExternal.openURL(item.url)}
                      accessibilityRole="link"
                      accessibilityLabel={t(labelKey)}
                    >
                      <Ionicons name={icon} size={20} color={Theme.text} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.storyCard}>
            <Text style={styles.storyKicker}>{t("profile.bio")}</Text>
            <Text style={styles.storyBody}>{profile.bio || "—"}</Text>
          </View>

          {reviews.length > 0 ? (
            <View style={styles.reviewSection}>
              <Text style={styles.sheetSceneLabel}>{t("profile.recentReviews")}</Text>
              {reviews.map((rev, idx) => {
                const r = Math.min(5, Math.max(1, Number(rev.rating) || 1));
                const raw = String(rev.comment || "").trim();
                const snippet =
                  raw.length > 140 ? `${raw.slice(0, 140).trim()}…` : raw || "—";
                const rk = rev.id != null ? `r-${rev.id}` : `r-${rev.created_at || ""}-${idx}`;
                return (
                  <View
                    key={rk}
                    style={[styles.reviewCard, idx === reviews.length - 1 ? styles.reviewCardLast : null]}
                  >
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Ionicons
                          key={i}
                          name={i <= r ? "star" : "star-outline"}
                          size={15}
                          color={Theme.text}
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewComment}>{snippet}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {showSafety ? (
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>{t("profile.safetyTitle")}</Text>
              <View style={styles.safetyRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.safetyBtn,
                    profile.viewer_has_blocked ? styles.safetyBtnNeutral : styles.safetyBtnDanger,
                    pressed ? styles.safetyBtnPressed : null,
                    blockBusy ? styles.safetyBtnDisabled : null,
                  ]}
                  onPress={toggleBlock}
                  disabled={blockBusy}
                >
                  <Ionicons
                    name={profile.viewer_has_blocked ? "lock-open-outline" : "ban-outline"}
                    size={18}
                    color={Theme.text}
                  />
                  <Text style={styles.safetyBtnText}>
                    {profile.viewer_has_blocked
                      ? t("profile.unblockUser")
                      : t("profile.blockUser")}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.safetyBtn,
                    styles.safetyBtnOutline,
                    pressed ? styles.safetyBtnPressed : null,
                  ]}
                  onPress={async () => {
                    try {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {
                      /* noop */
                    }
                    setReportVisible(true);
                  }}
                >
                  <Ionicons name="flag-outline" size={18} color={Theme.text} />
                  <Text style={styles.safetyBtnText}>{t("profile.reportUser")}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ReportUserSheet
        visible={reportVisible}
        userId={userId}
        token={token}
        onClose={() => setReportVisible(false)}
        onReported={() => load({ silent: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: Theme.bg },
  scroll: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.bg,
    paddingHorizontal: 24,
  },
  cinemaScene: {
    width: "100%",
    overflow: "hidden",
  },
  cinemaVignetteTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  cinemaSceneInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
  },
  cinemaHeroColumn: {
    width: "100%",
    alignItems: "center",
  },
  avatarPresenceRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.35)",
    marginBottom: 12,
  },
  avatarPresenceRingOnline: {
    borderWidth: 2,
    borderColor: "rgba(74,222,128,0.85)",
  },
  avatarPresenceRingAway: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.32)",
  },
  cinemaAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cinemaAvatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cinemaAvatarLetter: {
    fontSize: 36,
    fontWeight: "700",
    color: Theme.onWhite,
  },
  heroOnlineCentered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  heroOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  heroOnlineTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.15,
  },
  cinemaRoleLineCentered: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 6,
  },
  cinemaHeadlineCentered: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F5F5F0",
    letterSpacing: -0.6,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: "100%",
    paddingHorizontal: 8,
    ...Platform.select({
      android: { includeFontPadding: false },
    }),
  },
  cinemaBadgeStripCentered: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    maxWidth: "100%",
  },
  heroPresenceCentered: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.48)",
    textAlign: "center",
    paddingHorizontal: 16,
    alignSelf: "stretch",
  },
  lightSheet: {
    marginTop: 0,
    backgroundColor: Theme.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: Theme.line,
    marginBottom: 10,
    opacity: 0.75,
  },
  sheetSceneLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiCard: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    marginBottom: 12,
    overflow: "hidden",
  },
  statsFilmstrip: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 12,
  },
  kpiDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.line,
  },
  kpiTrustBlock: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  kpiTrustKicker: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  kpiTrustLine: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.text,
    letterSpacing: -0.1,
  },
  statFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  statSprocket: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Theme.line,
    opacity: 0.9,
    marginVertical: 4,
  },
  statFigure: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.5,
  },
  statRole: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    color: Theme.muted,
    textAlign: "center",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    lineHeight: 13,
    paddingHorizontal: 2,
  },
  socialDock: {
    marginBottom: 10,
  },
  socialDockRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  socialDockBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  socialDockBtnPressed: { opacity: 0.88 },
  storyCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    padding: 16,
    marginTop: 0,
    marginBottom: 12,
  },
  storyKicker: {
    fontSize: 10,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  storyBody: {
    fontSize: 16,
    lineHeight: 25,
    color: Theme.text,
    letterSpacing: -0.1,
  },
  safetyCard: {
    marginTop: 0,
    padding: 16,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.sub,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  safetyRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  safetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: "47%",
    flexGrow: 1,
  },
  safetyBtnDanger: { backgroundColor: "rgba(220,38,38,0.12)" },
  safetyBtnNeutral: { backgroundColor: Theme.soft },
  safetyBtnOutline: {
    backgroundColor: Theme.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  safetyBtnPressed: { opacity: 0.88 },
  safetyBtnDisabled: { opacity: 0.55 },
  safetyBtnText: { fontSize: 14, fontWeight: "700", color: Theme.text },
  error: { color: Theme.error, marginBottom: 12, textAlign: "center" },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  backText: { color: Theme.text, fontSize: 15, fontWeight: "600", marginLeft: 8 },
  skeletonScene: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
    gap: 14,
  },
  skeletonAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Theme.line,
    opacity: 0.45,
  },
  skeletonLines: { width: "72%", maxWidth: 280, gap: 10, alignItems: "center" },
  skeletonLineLg: {
    height: 18,
    borderRadius: 8,
    backgroundColor: Theme.line,
    opacity: 0.4,
    width: "100%",
  },
  skeletonLineSm: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.line,
    opacity: 0.35,
    width: "40%",
  },
  skeletonSheet: {
    marginHorizontal: 18,
    marginTop: 22,
    padding: 18,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    gap: 10,
  },
  skeletonBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.line,
    opacity: 0.38,
    width: "100%",
  },
  reviewSection: { marginBottom: 6 },
  reviewCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  reviewCardLast: { marginBottom: 0 },
  reviewStars: { flexDirection: "row", gap: 3, marginBottom: 8 },
  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.text,
    letterSpacing: -0.1,
  },
});
