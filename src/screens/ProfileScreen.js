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
import { PRIMARY } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function ProfileScreen({ route, navigation }) {
  const { token, signOut } = useAuth();
  const userId =
    route.params && route.params.userId ? route.params.userId : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meId, setMeId] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [meUser, setMeUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const mine = await api("/api/users/me", { token });
      setMeId(mine.user.id);
      setMeUser(mine.user);
      setEditName(mine.user.display_name || "");
      setEditBio(mine.user.bio || "");

      if (userId) {
        const pub = await api(`/api/users/${userId}`);
        setPublicProfile(pub.profile);
      } else {
        setPublicProfile(null);
      }
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function onSaveProfile() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await api("/api/users/me", {
        token,
        method: "PATCH",
        body: { display_name: editName, bio: editBio },
      });
      setMeUser(data.user);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Bitte anmelden.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  const isOwn = !userId || (meId !== null && userId === meId);

  if (!isOwn && publicProfile) {
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{publicProfile.display_name}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.stat}>
          Bewertung:{" "}
          {publicProfile.rating_count > 0
            ? `${publicProfile.rating_avg.toFixed(1)} (${publicProfile.rating_count})`
            : "noch keine"}
        </Text>
        <Text style={styles.stat}>
          Aktive Listings: {publicProfile.active_listings_count}
        </Text>
        <Text style={styles.stat}>
          Verkauft: {publicProfile.sold_count}
        </Text>
        <Text style={styles.label}>Bio</Text>
        <Text style={styles.bio}>{publicProfile.bio || "—"}</Text>
        <Pressable
          style={styles.link}
          onPress={() => navigation.setParams({ userId: undefined })}
        >
          <Text style={styles.linkText}>Zurück zu meinem Profil</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!isOwn && !publicProfile) {
    return (
      <View style={styles.center}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.muted}>Profil nicht gefunden.</Text>
        )}
        <Pressable
          style={styles.link}
          onPress={() => navigation.setParams({ userId: undefined })}
        >
          <Text style={styles.linkText}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profil</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {meUser ? (
        <Text style={styles.email}>{meUser.email}</Text>
      ) : null}
      <Text style={styles.label}>Anzeigename</Text>
      <TextInput
        style={styles.input}
        value={editName}
        onChangeText={setEditName}
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={editBio}
        onChangeText={setEditBio}
        multiline
        placeholderTextColor="#999"
      />
      {saving ? (
        <ActivityIndicator color={PRIMARY} style={styles.spinner} />
      ) : null}
      {!saving ? (
        <Pressable style={styles.btn} onPress={onSaveProfile}>
          <Text style={styles.btnText}>Speichern</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.outlineBtn} onPress={signOut}>
        <Text style={styles.outlineBtnText}>Abmelden</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  email: { color: "#666", marginTop: 8, marginBottom: 16 },
  label: {
    marginTop: 12,
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
    color: "#111",
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  stat: { fontSize: 15, color: "#333", marginTop: 8 },
  bio: { fontSize: 16, color: "#222", marginTop: 8 },
  error: { color: "#a00", marginBottom: 8 },
  muted: { color: "#888" },
  spinner: { marginVertical: 16 },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  outlineBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  outlineBtnText: { color: "#333", fontSize: 15 },
  link: { marginTop: 20 },
  linkText: { color: PRIMARY, fontSize: 15 },
});
