import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { LanguageToggle } from "../components/LanguageToggle";
import { useAuth } from "../AuthContext";
import { SOCIAL_PLATFORM_ORDER } from "../utils/socialPlatforms";

function emptySocialMap() {
  const o = {};
  SOCIAL_PLATFORM_ORDER.forEach(({ id }) => {
    o[id] = "";
  });
  return o;
}

function hydrateSocial(user) {
  const next = emptySocialMap();
  const arr = Array.isArray(user?.social_links) ? user.social_links : [];
  arr.forEach((item) => {
    if (item.platform && next[item.platform] !== undefined) {
      next[item.platform] = item.url || "";
    }
  });
  return next;
}

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [showLastSeen, setShowLastSeen] = useState(true);
  const [socialUrls, setSocialUrls] = useState(emptySocialMap);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const mine = await api("/api/users/me", { token });
      const u = mine.user;
      setEditName(u.display_name || "");
      setEditBio(u.bio || "");
      setShowLastSeen(u.show_last_seen !== false);
      setSocialUrls(hydrateSocial(u));
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  function setSocialField(platform, value) {
    setSocialUrls((prev) => ({ ...prev, [platform]: value }));
  }

  async function onSave() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const social_links = SOCIAL_PLATFORM_ORDER.map(({ id }) => ({
        platform: id,
        url: String(socialUrls[id] || "").trim(),
      })).filter((row) => row.url.length > 0);
      await api("/api/users/me", {
        token,
        method: "PATCH",
        body: {
          display_name: editName,
          bio: editBio,
          social_links,
          show_last_seen: showLastSeen,
        },
      });
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const scrollContent = {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Math.max(insets.bottom, 16) + 32,
  };

  if (!token) {
    return null;
  }

  if (loading) {
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
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="dark" />
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <View style={styles.card}>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{t("profile.language")}</Text>
          <LanguageToggle variant="light" layout="chips" compact />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.displayName")}</Text>
          <TextInput
            style={styles.input}
            value={editName}
            onChangeText={setEditName}
            placeholderTextColor={Theme.muted}
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.bio")}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={editBio}
            onChangeText={setEditBio}
            multiline
            placeholderTextColor={Theme.muted}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("profile.showLastSeen")}</Text>
          <Switch
            value={showLastSeen}
            onValueChange={setShowLastSeen}
            trackColor={{ false: Theme.line, true: Theme.heroBg }}
            thumbColor={Theme.surface}
          />
        </View>
        <Text style={styles.hint}>{t("profile.socialHint")}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t("profile.socialSectionEdit")}</Text>
        {SOCIAL_PLATFORM_ORDER.map(({ id, icon }) => (
          <View key={id} style={styles.fieldBlock}>
            <View style={styles.socialLabelRow}>
              <Ionicons name={icon} size={18} color={Theme.sub} />
              <Text style={styles.fieldLabel}>{t(`profile.social_${id}`)}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={socialUrls[id]}
              onChangeText={(v) => setSocialField(id, v)}
              placeholder="https://…"
              placeholderTextColor={Theme.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        ))}
      </View>

      {saving ? (
        <ActivityIndicator color={Theme.text} style={styles.spinner} />
      ) : (
        <Pressable
          style={({ pressed }) => [styles.btn, pressed ? styles.btnPressed : null]}
          onPress={onSave}
        >
          <Ionicons name="checkmark-circle" size={20} color={Theme.onWhite} />
          <Text style={styles.btnText}>{t("profile.save")}</Text>
        </Pressable>
      )}
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
  },
  errorBanner: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: Theme.error,
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    padding: 16,
    marginBottom: 16,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 4,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.sub,
    marginRight: 8,
  },
  fieldBlock: { marginTop: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.sub,
    marginBottom: 6,
  },
  socialLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.text,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Theme.text,
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: Theme.muted,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.bg,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  spinner: { marginVertical: 16 },
  btn: {
    backgroundColor: Theme.heroBg,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnPressed: { opacity: 0.92 },
  btnText: { color: Theme.onWhite, fontSize: 16, fontWeight: "700" },
});
