import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { profileInitial } from "../utils/profileInitial";
import { pickProfileAvatarDataUrl } from "../utils/pickProfileAvatar";
import { resolveUserAvatarUri } from "../utils/resolveUserAvatarUri";

const APP_VERSION =
  Constants.expoConfig?.version ??
  Constants.nativeAppVersion ??
  "1.0.0";

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  isLast,
  danger,
  showChevron = true,
}) {
  const iconColor = danger ? Theme.error : Theme.sub;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !isLast ? styles.menuRowBorder : null,
        pressed ? styles.menuRowPressed : null,
      ]}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextCol}>
        <Text style={[styles.menuTitle, danger ? styles.menuTitleDanger : null]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.menuSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={Theme.muted} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileHubScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token, signOut, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meUser, setMeUser] = useState(null);
  const [meId, setMeId] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!token) {
          setLoading(false);
          return;
        }
        try {
          const mine = await api("/api/users/me", { token });
          if (!cancelled) {
            setMeId(mine.user.id);
            setMeUser(mine.user);
          }
        } catch {
          if (!cancelled) {
            setMeUser(null);
            setMeId(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  const scrollContent = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 16) + 24,
  };

  const displayName =
    meUser && String(meUser.display_name || "").trim()
      ? meUser.display_name
      : "—";
  const avatarLetter = profileInitial(meUser?.display_name, meUser?.email);
  const avatarUri = resolveUserAvatarUri(meUser?.avatar_url);

  const uploadAvatar = useCallback(
    async (dataUrl) => {
      if (!token) {
        return;
      }
      setAvatarUploading(true);
      try {
        const data = await api("/api/users/me", {
          token,
          method: "PATCH",
          body: { avatar_url: dataUrl },
        });
        setMeUser(data.user);
      } catch (e) {
        Alert.alert(t("common.error"), e.message || t("profile.avatarErrorGeneric"));
      } finally {
        setAvatarUploading(false);
      }
    },
    [token, t]
  );

  const onAvatarPress = useCallback(async () => {
    if (avatarUploading) {
      return;
    }
    try {
      const dataUrl = await pickProfileAvatarDataUrl();
      if (!dataUrl) {
        return;
      }
      await uploadAvatar(dataUrl);
    } catch (e) {
      const code = e && e.code;
      if (code === "PERMISSION_DENIED") {
        Alert.alert(t("common.error"), t("profile.avatarErrorPermission"));
      } else if (code === "TOO_LARGE" || code === "NO_BASE64") {
        Alert.alert(t("common.error"), t("profile.avatarErrorTooLarge"));
      } else {
        Alert.alert(t("common.error"), t("profile.avatarErrorGeneric"));
      }
    }
  }, [avatarUploading, uploadAvatar, t]);

  const onAvatarLongPress = useCallback(() => {
    if (!token || !meUser?.avatar_url || avatarUploading) {
      return;
    }
    Alert.alert(
      t("profile.avatarRemoveTitle"),
      t("profile.avatarRemoveBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.avatarRemoveConfirm"),
          style: "destructive",
          onPress: () => uploadAvatar(""),
        },
      ]
    );
  }, [token, meUser?.avatar_url, avatarUploading, uploadAvatar, t]);

  if (!token) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>
      </View>
    );
  }

  if (loading && !meUser) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <Pressable
          onPress={onAvatarPress}
          onLongPress={onAvatarLongPress}
          style={({ pressed }) => [
            styles.avatarPress,
            pressed ? styles.avatarPressPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("profile.title")}
        >
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            )}
            {avatarUploading ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color={Theme.onWhite} size="small" />
              </View>
            ) : null}
          </View>
          <View style={styles.cameraBadge} pointerEvents="none">
            <Ionicons name="camera" size={13} color={Theme.sub} />
          </View>
        </Pressable>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerEyebrow}>{t("profile.title")}</Text>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerName} numberOfLines={2}>
              {displayName}
            </Text>
            {meUser?.is_verified ? (
              <View
                style={styles.verifiedBadge}
                accessibilityLabel={t("profile.verified")}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Theme.accentGreen}
                />
                <Text style={styles.verifiedBadgeText}>
                  {t("profile.verified")}
                </Text>
              </View>
            ) : null}
          </View>
          {meUser ? (
            <Text style={styles.headerEmail} numberOfLines={1}>
              {meUser.email}
            </Text>
          ) : null}
          <Text style={styles.avatarHint}>{t("profile.avatarHint")}</Text>
        </View>
      </View>

      {isAdmin ? (
        <>
          <Text style={styles.sectionLabel}>{t("profile.sectionAdmin")}</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="shield-checkmark-outline"
              title={t("profile.menuAdmin")}
              subtitle={t("profile.menuAdminSub")}
              onPress={() => navigation.navigate("AdminPanel")}
              isLast
            />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>{t("profile.sectionProfile")}</Text>
      <View style={styles.menuCard}>
        <MenuRow
          icon="create-outline"
          title={t("profile.menuEditProfile")}
          subtitle={t("profile.menuEditProfileSub")}
          onPress={() => navigation.navigate("ProfileEdit")}
          isLast={false}
        />
        <MenuRow
          icon="cube-outline"
          title={t("profile.menuShipping")}
          subtitle={t("profile.menuShippingSub")}
          onPress={() => navigation.navigate("ProfileShipping")}
          isLast={false}
        />
        <MenuRow
          icon="swap-horizontal-outline"
          title={t("profile.menuDeals")}
          subtitle={t("profile.menuDealsSub")}
          onPress={() => navigation.navigate("DealsList")}
          isLast
        />
      </View>

      <Text style={styles.sectionLabel}>{t("profile.sectionPublic")}</Text>
      <View style={styles.menuCard}>
        <MenuRow
          icon="eye-outline"
          title={t("profile.menuPreview")}
          subtitle={t("profile.menuPreviewSub")}
          onPress={() => {
            if (meId) {
              navigation.navigate("ProfilePublicUser", { userId: meId });
            }
          }}
          isLast
        />
      </View>

      <Text style={styles.sectionLabel}>{t("profile.sectionLegal")}</Text>
      <View style={styles.menuCard}>
        <MenuRow
          icon="help-circle-outline"
          title={t("profile.menuSupport")}
          subtitle={t("profile.menuSupportSub")}
          onPress={() => navigation.navigate("ProfileSupport")}
          isLast={false}
        />
        <MenuRow
          icon="business-outline"
          title={t("profile.menuImprint")}
          onPress={() =>
            navigation.navigate("ProfileLegal", { kind: "imprint" })
          }
          isLast={false}
        />
        <MenuRow
          icon="document-text-outline"
          title={t("profile.menuTerms")}
          onPress={() => navigation.navigate("ProfileLegal", { kind: "terms" })}
          isLast={false}
        />
        <MenuRow
          icon="shield-checkmark-outline"
          title={t("profile.menuPrivacy")}
          onPress={() =>
            navigation.navigate("ProfileLegal", { kind: "privacy" })
          }
          isLast
        />
      </View>

      <Text style={styles.sectionLabel}>{t("profile.sectionAccount")}</Text>
      <View style={styles.menuCard}>
        <MenuRow
          icon="log-out-outline"
          title={t("profile.signOut")}
          onPress={signOut}
          isLast={false}
        />
        <MenuRow
          icon="trash-outline"
          title={t("profile.menuDeleteAccount")}
          subtitle={t("profile.menuDeleteAccountSub")}
          onPress={() => navigation.navigate("ProfileDeleteAccount")}
          isLast
          danger
        />
      </View>

      <Text style={styles.versionLine}>
        {t("profile.version", { version: APP_VERSION })}
      </Text>
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
    alignItems: "flex-start",
    marginBottom: 22,
  },
  avatarPress: { position: "relative", marginRight: 14 },
  avatarPressPressed: { opacity: 0.9 },
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
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.onWhite,
  },
  cameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
  },
  headerTextCol: { flex: 1, minWidth: 0 },
  headerNameRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  verifiedBadge: {
    marginLeft: 8,
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(21,128,61,0.12)",
  },
  verifiedBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
    color: Theme.accentGreen,
  },
  avatarHint: {
    marginTop: 6,
    fontSize: 11,
    color: Theme.muted,
    lineHeight: 15,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerName: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.4,
  },
  headerEmail: {
    marginTop: 4,
    fontSize: 14,
    color: Theme.muted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Theme.surface,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  menuRowPressed: { opacity: 0.85 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.soft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextCol: { flex: 1, minWidth: 0 },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.text,
    letterSpacing: -0.2,
  },
  menuTitleDanger: {
    color: Theme.error,
  },
  menuSub: {
    marginTop: 3,
    fontSize: 13,
    color: Theme.muted,
    lineHeight: 18,
  },
  versionLine: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    color: Theme.muted,
  },
  muted: { color: Theme.muted },
});
