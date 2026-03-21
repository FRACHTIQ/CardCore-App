import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PRIMARY } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const POLL_MS = 25000;

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function FavoritesScreen({ navigation }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError("");
    try {
      const data = await api("/api/favorites", { token });
      setItems(data.favorites || []);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function renderItem({ item }) {
    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          navigation.navigate("ListingDetail", { id: item.id })
        }
      >
        <Text style={styles.rowTitle}>
          {item.player_name} · {item.year}
        </Text>
        <Text style={styles.rowMeta}>
          {item.sport} · {item.manufacturer}
        </Text>
        <Text style={styles.rowPrice}>
          {formatPrice(item.price_cents, item.currency)}
        </Text>
      </Pressable>
    );
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

  return (
    <View style={styles.wrap}>
      <Text style={styles.head}>Dein Merkzettel</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Noch keine Favoriten.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fafafa" },
  head: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    color: "#111",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#888" },
  error: { padding: 16, color: "#a00" },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#111" },
  rowMeta: { fontSize: 14, color: "#555", marginTop: 4 },
  rowPrice: { fontSize: 15, color: PRIMARY, marginTop: 8, fontWeight: "600" },
  empty: { textAlign: "center", color: "#888", marginTop: 32 },
});
