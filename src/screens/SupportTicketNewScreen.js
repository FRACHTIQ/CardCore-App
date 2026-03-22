import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

export default function SupportTicketNewScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (!token) {
      return;
    }
    setError("");
    const s = subject.trim();
    const b = body.trim();
    if (!s || !b) {
      setError(t("common.error"));
      return;
    }
    setSaving(true);
    try {
      await api("/api/support/tickets", {
        token,
        method: "POST",
        body: { subject: s, body: b },
      });
      navigation.goBack();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>{t("support.subject")}</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder={t("support.subjectPh")}
          placeholderTextColor={Theme.muted}
          editable={!saving}
        />
        <Text style={styles.label}>{t("support.message")}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={body}
          onChangeText={setBody}
          placeholder={t("support.messagePh")}
          placeholderTextColor={Theme.muted}
          multiline
          textAlignVertical="top"
          editable={!saving}
        />
        {saving ? (
          <ActivityIndicator color={Theme.text} style={styles.spinner} />
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              pressed ? styles.btnPressed : null,
            ]}
            onPress={onSubmit}
          >
            <Ionicons name="send" size={18} color={Theme.onWhite} />
            <Text style={styles.btnText}>{t("support.send")}</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  scroll: { padding: 16, paddingTop: 12 },
  error: { color: Theme.error, marginBottom: 12, fontSize: 14 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.sub,
    marginBottom: 6,
    marginTop: 8,
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
  multiline: { minHeight: 160 },
  spinner: { marginVertical: 20 },
  btn: {
    marginTop: 20,
    backgroundColor: Theme.heroBg,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: { opacity: 0.92 },
  btnText: {
    color: Theme.onWhite,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
