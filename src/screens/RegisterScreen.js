import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIMARY } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function RegisterScreen({ navigation }) {
  const { setToken } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          display_name: displayName,
        },
      });
      await setToken(data.token);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>CardCore</Text>
      <Text style={styles.title}>Registrieren</Text>
      <TextInput
        style={styles.input}
        placeholder="Anzeigename"
        placeholderTextColor="#999"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort (min. 8 Zeichen)"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={styles.spinner} />
      ) : null}
      {!loading ? (
        <Pressable style={styles.btn} onPress={onSubmit}>
          <Text style={styles.btnText}>Konto anlegen</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={styles.link}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.linkText}>Zurück zur Anmeldung</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    color: PRIMARY,
    marginBottom: 8,
  },
  title: { fontSize: 20, marginBottom: 20, color: "#111" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#111",
  },
  error: { color: "#a00", marginBottom: 8 },
  spinner: { marginVertical: 12 },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: PRIMARY, fontSize: 15 },
});
