import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIMARY, CARD_TYPES } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function CreateListingScreen({ navigation }) {
  const { token } = useAuth();
  const [sport, setSport] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [setName, setSetName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardType, setCardType] = useState("BASE");
  const [conditionGrade, setConditionGrade] = useState("");
  const [priceEuro, setPriceEuro] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrlsRaw, setImageUrlsRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSave() {
    setError("");
    const y = Number(year);
    const pe = String(priceEuro).replace(",", ".").trim();
    const euros = Number(pe);
    if (!Number.isInteger(y) || y < 1800 || y > 2100) {
      setError("Jahr ungültig.");
      return;
    }
    if (!Number.isFinite(euros) || euros < 0) {
      setError("Preis ungültig.");
      return;
    }
    const priceCents = Math.round(euros * 100);
    const imageUrls = imageUrlsRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await api("/api/listings", {
        token,
        method: "POST",
        body: {
          sport,
          manufacturer,
          set_name: setName,
          year: y,
          player_name: playerName,
          team,
          card_number: cardNumber,
          card_type: cardType,
          condition_grade: conditionGrade,
          price_cents: priceCents,
          currency: "EUR",
          description,
          image_urls: imageUrls,
          status: "ACTIVE",
        },
      });
      navigation.navigate("HomeMain");
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>
        Strukturierte Daten – alle Pflichtfelder ausfüllen.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Sport</Text>
      <TextInput
        style={styles.input}
        value={sport}
        onChangeText={setSport}
        placeholder="z. B. Basketball"
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Hersteller</Text>
      <TextInput
        style={styles.input}
        value={manufacturer}
        onChangeText={setManufacturer}
        placeholder="z. B. Panini"
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Set / Box</Text>
      <TextInput
        style={styles.input}
        value={setName}
        onChangeText={setSetName}
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Jahr</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Spielername</Text>
      <TextInput
        style={styles.input}
        value={playerName}
        onChangeText={setPlayerName}
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Team</Text>
      <TextInput
        style={styles.input}
        value={team}
        onChangeText={setTeam}
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Kartennummer</Text>
      <TextInput
        style={styles.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Kartentyp</Text>
      <View style={styles.typeRow}>
        {CARD_TYPES.map((t) => (
          <Pressable
            key={t}
            style={
              cardType === t ? styles.typeChipActive : styles.typeChip
            }
            onPress={() => setCardType(t)}
          >
            <Text
              style={
                cardType === t ? styles.typeChipTextActive : styles.typeChipText
              }
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Zustand</Text>
      <TextInput
        style={styles.input}
        value={conditionGrade}
        onChangeText={setConditionGrade}
        placeholder="z. B. NM-MT"
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Preis (EUR)</Text>
      <TextInput
        style={styles.input}
        value={priceEuro}
        onChangeText={setPriceEuro}
        keyboardType="decimal-pad"
        placeholder="z. B. 49.90"
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Beschreibung</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholderTextColor="#999"
      />
      <Text style={styles.label}>Bild-URLs (Komma oder Zeile)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={imageUrlsRaw}
        onChangeText={setImageUrlsRaw}
        multiline
        placeholder="https://…"
        placeholderTextColor="#999"
      />
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={styles.spinner} />
      ) : null}
      {!loading ? (
        <Pressable style={styles.btn} onPress={onSave}>
          <Text style={styles.btnText}>Listing veröffentlichen</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 48 },
  hint: { color: "#666", marginBottom: 12, fontSize: 14 },
  error: { color: "#a00", marginBottom: 8 },
  label: {
    marginTop: 10,
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
  typeRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeChipActive: {
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#f8f0ef",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeChipText: { color: "#444", fontSize: 12 },
  typeChipTextActive: { color: PRIMARY, fontSize: 12, fontWeight: "600" },
  spinner: { marginVertical: 16 },
  btn: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
