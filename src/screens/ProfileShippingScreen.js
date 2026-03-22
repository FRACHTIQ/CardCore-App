import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { useAuth } from "../AuthContext";

export default function ProfileShippingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editLegalName, setEditLegalName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editAddressExtra, setEditAddressExtra] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("DE");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const mine = await api("/api/users/me", { token });
      const u = mine.user;
      setEditLegalName(u.legal_name || "");
      setEditPhone(u.phone || "");
      setEditStreet(u.street || "");
      setEditAddressExtra(u.address_extra || "");
      setEditPostalCode(u.postal_code || "");
      setEditCity(u.city || "");
      setEditCountry(
        u.country && String(u.country).trim()
          ? String(u.country).trim().toUpperCase().slice(0, 2)
          : "DE"
      );
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/api/users/me", {
        token,
        method: "PATCH",
        body: {
          legal_name: editLegalName,
          phone: editPhone,
          street: editStreet,
          address_extra: editAddressExtra,
          postal_code: editPostalCode,
          city: editCity,
          country: editCountry,
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

      <Text style={styles.hint}>{t("profile.tradeHint")}</Text>

      <View style={styles.card}>
        <View style={[styles.fieldBlock, styles.fieldBlockFirst]}>
          <Text style={styles.fieldLabel}>{t("profile.legalName")}</Text>
          <TextInput
            style={styles.input}
            value={editLegalName}
            onChangeText={setEditLegalName}
            placeholder={t("profile.legalNamePh")}
            placeholderTextColor={Theme.muted}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.phone")}</Text>
          <TextInput
            style={styles.input}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder={t("profile.phonePh")}
            placeholderTextColor={Theme.muted}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.street")}</Text>
          <TextInput
            style={styles.input}
            value={editStreet}
            onChangeText={setEditStreet}
            placeholder={t("profile.streetPh")}
            placeholderTextColor={Theme.muted}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.addressExtra")}</Text>
          <TextInput
            style={styles.input}
            value={editAddressExtra}
            onChangeText={setEditAddressExtra}
            placeholder={t("profile.addressExtraPh")}
            placeholderTextColor={Theme.muted}
          />
        </View>
        <View style={styles.row2}>
          <View style={styles.row2Item}>
            <Text style={styles.fieldLabel}>{t("profile.postalCode")}</Text>
            <TextInput
              style={styles.input}
              value={editPostalCode}
              onChangeText={setEditPostalCode}
              placeholder={t("profile.postalCodePh")}
              placeholderTextColor={Theme.muted}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.row2Item, styles.row2Grow]}>
            <Text style={styles.fieldLabel}>{t("profile.city")}</Text>
            <TextInput
              style={styles.input}
              value={editCity}
              onChangeText={setEditCity}
              placeholder={t("profile.cityPh")}
              placeholderTextColor={Theme.muted}
              autoCapitalize="words"
            />
          </View>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>{t("profile.country")}</Text>
          <TextInput
            style={[styles.input, styles.countryInput]}
            value={editCountry}
            onChangeText={(v) =>
              setEditCountry(String(v || "").toUpperCase().slice(0, 2))
            }
            placeholder={t("profile.countryPh")}
            placeholderTextColor={Theme.muted}
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
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
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: Theme.muted,
    marginBottom: 14,
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
  fieldBlock: { marginTop: 14 },
  fieldBlockFirst: { marginTop: 0 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.sub,
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.surface,
  },
  countryInput: {
    maxWidth: 88,
    fontWeight: "700",
    letterSpacing: 1,
  },
  row2: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
  },
  row2Item: { flex: 1, minWidth: 0 },
  row2Grow: { flex: 1.35, marginLeft: 10 },
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
