import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PRIMARY, CARD_TYPES } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const POLL_MS = 30000;

const SORT_OPTIONS = [
  { key: "updated_at_desc", label: "Neueste" },
  { key: "price_asc", label: "Preis ↑" },
  { key: "price_desc", label: "Preis ↓" },
  { key: "year_desc", label: "Jahr" },
];

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function HomeScreen({ navigation }) {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showMore, setShowMore] = useState(false);

  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [team, setTeam] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [minEur, setMinEur] = useState("");
  const [maxEur, setMaxEur] = useState("");
  const [conditionGrade, setConditionGrade] = useState("");
  const [cardType, setCardType] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSport, setAppliedSport] = useState("");
  const [appliedManufacturer, setAppliedManufacturer] = useState("");
  const [appliedTeam, setAppliedTeam] = useState("");
  const [appliedCardNumber, setAppliedCardNumber] = useState("");
  const [appliedYearFrom, setAppliedYearFrom] = useState("");
  const [appliedYearTo, setAppliedYearTo] = useState("");
  const [appliedMinEur, setAppliedMinEur] = useState("");
  const [appliedMaxEur, setAppliedMaxEur] = useState("");
  const [appliedCondition, setAppliedCondition] = useState("");
  const [appliedCardType, setAppliedCardType] = useState("");
  const [appliedSort, setAppliedSort] = useState("updated_at_desc");

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
      if (appliedManufacturer.trim()) {
        q.set("manufacturer", appliedManufacturer.trim());
      }
      if (appliedTeam.trim()) {
        q.set("team", appliedTeam.trim());
      }
      if (appliedCardNumber.trim()) {
        q.set("card_number", appliedCardNumber.trim());
      }
      if (appliedYearFrom.trim()) {
        q.set("year_from", appliedYearFrom.trim());
      }
      if (appliedYearTo.trim()) {
        q.set("year_to", appliedYearTo.trim());
      }
      if (appliedMinEur.trim()) {
        q.set("min_price_eur", appliedMinEur.trim().replace(",", "."));
      }
      if (appliedMaxEur.trim()) {
        q.set("max_price_eur", appliedMaxEur.trim().replace(",", "."));
      }
      if (appliedCondition.trim()) {
        q.set("condition_grade", appliedCondition.trim());
      }
      if (appliedCardType.trim()) {
        q.set("card_type", appliedCardType.trim());
      }
      if (appliedSort.trim()) {
        q.set("sort", appliedSort.trim());
      }
      const qs = q.toString();
      const path = `/api/listings?${qs}`;
      const opts = token ? { token } : {};
      const data = await api(path, opts);
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    appliedSearch,
    appliedSport,
    appliedManufacturer,
    appliedTeam,
    appliedCardNumber,
    appliedYearFrom,
    appliedYearTo,
    appliedMinEur,
    appliedMaxEur,
    appliedCondition,
    appliedCardType,
    appliedSort,
    token,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  function applyFilters() {
    setAppliedSearch(search);
    setAppliedSport(sport);
    setAppliedManufacturer(manufacturer);
    setAppliedTeam(team);
    setAppliedCardNumber(cardNumber);
    setAppliedYearFrom(yearFrom);
    setAppliedYearTo(yearTo);
    setAppliedMinEur(minEur);
    setAppliedMaxEur(maxEur);
    setAppliedCondition(conditionGrade);
    setAppliedCardType(cardType);
  }

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
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle}>
            {item.player_name} · {item.year}
          </Text>
          {item.is_favorited ? (
            <Text style={styles.badge}>Merkzettel</Text>
          ) : null}
        </View>
        <Text style={styles.rowMeta}>
          {item.sport} · {item.manufacturer}
        </Text>
        <Text style={styles.rowSub}>
          {item.card_type} · {item.condition_grade}
        </Text>
        <Text style={styles.rowPrice}>
          {formatPrice(item.price_cents, item.currency)}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.filterScroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <TextInput
          style={styles.filterInput}
          placeholder="Suche Spieler, Team, Beschreibung …"
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
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Hersteller"
          placeholderTextColor="#999"
          value={manufacturer}
          onChangeText={setManufacturer}
        />
        <Pressable
          style={styles.moreBtn}
          onPress={() => setShowMore(!showMore)}
        >
          <Text style={styles.moreBtnText}>
            {showMore ? "Weniger Filter" : "Mehr Filter"}
          </Text>
        </Pressable>
        {showMore ? (
          <View>
            <TextInput
              style={styles.filterInput}
              placeholder="Team"
              placeholderTextColor="#999"
              value={team}
              onChangeText={setTeam}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Kartennummer"
              placeholderTextColor="#999"
              value={cardNumber}
              onChangeText={setCardNumber}
            />
            <View style={styles.row2}>
              <TextInput
                style={[styles.filterInput, styles.half]}
                placeholder="Jahr von"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={yearFrom}
                onChangeText={setYearFrom}
              />
              <TextInput
                style={[styles.filterInput, styles.half]}
                placeholder="Jahr bis"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={yearTo}
                onChangeText={setYearTo}
              />
            </View>
            <View style={styles.row2}>
              <TextInput
                style={[styles.filterInput, styles.half]}
                placeholder="Min. EUR"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={minEur}
                onChangeText={setMinEur}
              />
              <TextInput
                style={[styles.filterInput, styles.half]}
                placeholder="Max. EUR"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={maxEur}
                onChangeText={setMaxEur}
              />
            </View>
            <TextInput
              style={styles.filterInput}
              placeholder="Zustand (z. B. NM-MT)"
              placeholderTextColor="#999"
              value={conditionGrade}
              onChangeText={setConditionGrade}
            />
            <Text style={styles.filterLabel}>Kartentyp</Text>
            <View style={styles.typeWrap}>
              <Pressable
                style={
                  cardType === "" ? styles.typeChipOn : styles.typeChip
                }
                onPress={() => setCardType("")}
              >
                <Text
                  style={
                    cardType === "" ? styles.typeChipTextOn : styles.typeChipText
                  }
                >
                  Alle
                </Text>
              </Pressable>
              {CARD_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={
                    cardType === t ? styles.typeChipOn : styles.typeChip
                  }
                  onPress={() => setCardType(t)}
                >
                  <Text
                    style={
                      cardType === t ? styles.typeChipTextOn : styles.typeChipText
                    }
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Text style={styles.filterLabel}>Sortierung</Text>
        <View style={styles.sortWrap}>
          {SORT_OPTIONS.map((s) => (
            <Pressable
              key={s.key}
              style={
                appliedSort === s.key ? styles.sortOn : styles.sortOff
              }
              onPress={() => setAppliedSort(s.key)}
            >
              <Text
                style={
                  appliedSort === s.key ? styles.sortTextOn : styles.sortTextOff
                }
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.filterBtn} onPress={applyFilters}>
          <Text style={styles.filterBtnText}>Filtern und laden</Text>
        </Pressable>
      </ScrollView>
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={styles.centered} />
      ) : null}
      {!loading ? (
        error ? <Text style={styles.error}>{error}</Text> : null
      ) : null}
      {!loading ? (
        error ? null : (
          <Text style={styles.count}>{total} Treffer</Text>
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
  filterScroll: {
    maxHeight: 380,
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
  filterLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row2: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 0,
  },
  half: { flex: 1 },
  moreBtn: { marginBottom: 8 },
  moreBtnText: { color: PRIMARY, fontWeight: "600", fontSize: 14 },
  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeChipOn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#f8f0ef",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeChipText: { fontSize: 11, color: "#444" },
  typeChipTextOn: { fontSize: 11, color: PRIMARY, fontWeight: "600" },
  sortWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  sortOff: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortOn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: "#f8f0ef",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortTextOff: { fontSize: 13, color: "#444" },
  sortTextOn: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
  filterBtn: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
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
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#111", flex: 1 },
  badge: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rowMeta: { fontSize: 14, color: "#555", marginTop: 4 },
  rowSub: { fontSize: 13, color: "#777", marginTop: 4 },
  rowPrice: { fontSize: 15, color: PRIMARY, marginTop: 8, fontWeight: "600" },
  empty: { textAlign: "center", color: "#888", marginTop: 32 },
});
