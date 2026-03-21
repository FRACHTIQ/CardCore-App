import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIMARY } from "../config";
import { api } from "../api";

const POLL_MS = 30000;

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSport, setAppliedSport] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const q = new URLSearchParams();
      q.set("limit", "40");
      if (appliedSearch.trim()) {
        q.set("search", appliedSearch.trim());
      }
      if (appliedSport.trim()) {
        q.set("sport", appliedSport.trim());
      }
      const qs = q.toString();
      const path = qs ? `/api/listings?${qs}` : "/api/listings?limit=40";
      const data = await api(path);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedSearch, appliedSport]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setAppliedSearch(search);
    setAppliedSport(sport);
  }

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

  return (
    <View style={styles.wrap}>
      <View style={styles.filters}>
        <TextInput
          style={styles.filterInput}
          placeholder="Suche Spieler, Team …"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applyFilters}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Sport"
          placeholderTextColor="#999"
          value={sport}
          onChangeText={setSport}
          onSubmitEditing={applyFilters}
        />
        <Pressable style={styles.filterBtn} onPress={applyFilters}>
          <Text style={styles.filterBtnText}>Filtern</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={styles.centered} />
      ) : null}
      {!loading ? (
        error ? <Text style={styles.error}>{error}</Text> : null
      ) : null}
      {!loading ? (
        error ? null : (
          <Text style={styles.count}>
            {total} Treffer
          </Text>
        )
      ) : null}
      {!loading ? (
        error ? null : (
          <FlatList
            data={listings}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Keine Listings.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fafafa" },
  filters: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 15,
    color: "#111",
  },
  filterBtn: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterBtnText: { color: "#fff", fontWeight: "600" },
  centered: { marginTop: 24 },
  error: { padding: 16, color: "#a00" },
  count: { paddingHorizontal: 16, paddingTop: 8, color: "#666", fontSize: 13 },
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
