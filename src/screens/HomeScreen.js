import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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
import { CARD_TYPES, USE_DEMO_LISTINGS_FALLBACK } from "../config";
import { DEMO_LISTINGS } from "../data/demoListings";
import { filterAndSortDemoListings } from "../utils/demoListingFilter";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const POLL_MS = 30000;
const SEARCH_DEBOUNCE_MS = 400;

const BG = "#F5F5F5";
const CARD_DARK = "#1A1A1A";
const TEXT_DARK = "#000000";
const MUTED = "#8E8E93";
const SUB = "#3c3c43";
const LINE = "rgba(0,0,0,0.08)";
const WHITE = "#FFFFFF";
const GREEN_TREND = "#00C853";
const CHIP_BG = "rgba(0,0,0,0.06)";
const SHEET_BG = "#FFFFFF";

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

function formatPortfolioEur(cents, locale) {
  const loc = String(locale || "").startsWith("de") ? "de-DE" : "en-US";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format((Number(cents) || 0) / 100);
}

function listingInitials(playerName) {
  if (!playerName || typeof playerName !== "string") {
    return "?";
  }
  const parts = playerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return (a + b).toUpperCase();
  }
  return playerName.trim().slice(0, 2).toUpperCase() || "?";
}

export default function HomeScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const sortOptions = useMemo(
    () => [
      { key: "updated_at_desc", label: t("home.sortNewest") },
      { key: "price_asc", label: t("home.sortPriceAsc") },
      { key: "price_desc", label: t("home.sortPriceDesc") },
      { key: "year_desc", label: t("home.sortYear") },
    ],
    [t]
  );

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

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

  useEffect(() => {
    const id = setTimeout(() => {
      setAppliedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  function openFilterSheet() {
    setSport(appliedSport);
    setManufacturer(appliedManufacturer);
    setTeam(appliedTeam);
    setCardNumber(appliedCardNumber);
    setYearFrom(appliedYearFrom);
    setYearTo(appliedYearTo);
    setMinEur(appliedMinEur);
    setMaxEur(appliedMaxEur);
    setConditionGrade(appliedCondition);
    setCardType(appliedCardType);
    setSheetOpen(true);
  }

  const load = useCallback(async () => {
    setError("");
    const demoFilters = {
      search: appliedSearch,
      sport: appliedSport,
      manufacturer: appliedManufacturer,
      team: appliedTeam,
      cardNumber: appliedCardNumber,
      yearFrom: appliedYearFrom,
      yearTo: appliedYearTo,
      minEur: appliedMinEur,
      maxEur: appliedMaxEur,
      conditionGrade: appliedCondition,
      cardType: appliedCardType,
      sort: appliedSort,
    };
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
      let list = data.listings || [];
      let tot = data.total || 0;

      if (USE_DEMO_LISTINGS_FALLBACK && list.length === 0) {
        list = filterAndSortDemoListings(DEMO_LISTINGS, demoFilters);
        tot = list.length;
      }
      setListings(list);
      setTotal(tot);
    } catch (e) {
      if (USE_DEMO_LISTINGS_FALLBACK) {
        const filtered = filterAndSortDemoListings(DEMO_LISTINGS, demoFilters);
        setListings(filtered);
        setTotal(filtered.length);
        setError("");
      } else {
        setError(e.message || t("common.error"));
      }
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
    t,
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

  function applySheetFilters() {
    setAppliedSport(sport.trim());
    setAppliedManufacturer(manufacturer.trim());
    setAppliedTeam(team.trim());
    setAppliedCardNumber(cardNumber.trim());
    setAppliedYearFrom(yearFrom.trim());
    setAppliedYearTo(yearTo.trim());
    setAppliedMinEur(minEur.trim());
    setAppliedMaxEur(maxEur.trim());
    setAppliedCondition(conditionGrade.trim());
    setAppliedCardType(cardType.trim());
  }

  function closeSheet() {
    applySheetFilters();
    setSheetOpen(false);
  }

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const portfolioSumCents = useMemo(
    () =>
      listings.reduce((s, x) => s + (Number(x.price_cents) || 0), 0),
    [listings]
  );

  const trendingItems = useMemo(() => listings.slice(0, 8), [listings]);

  const hasAdvancedFilters = useMemo(
    () =>
      Boolean(
        appliedSport ||
          appliedManufacturer ||
          appliedTeam ||
          appliedCardNumber ||
          appliedYearFrom ||
          appliedYearTo ||
          appliedMinEur ||
          appliedMaxEur ||
          appliedCondition ||
          appliedCardType
      ),
    [
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
    ]
  );

  function openProfile() {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("Profile");
    }
  }

  function scrollToAllOffers() {
    flatListRef.current?.scrollToOffset({ offset: 420, animated: true });
  }

  const renderTrendingCard = useCallback(
    (item) => {
      const uri =
        item.image_urls &&
        Array.isArray(item.image_urls) &&
        item.image_urls[0]
          ? item.image_urls[0]
          : null;
      const sub = `${item.condition_grade || "—"} · ${item.card_type || ""}`;
      return (
        <Pressable
          key={String(item.id)}
          style={({ pressed }) => [
            styles.trendCard,
            pressed ? styles.trendCardPressed : null,
          ]}
          onPress={() =>
            navigation.navigate("ListingDetail", { id: item.id })
          }
        >
          {uri ? (
            <Image source={{ uri }} style={styles.trendThumbImg} />
          ) : (
            <View style={styles.trendThumbPlaceholder} />
          )}
          <View style={styles.trendCardBody}>
            <Text style={styles.trendTitle} numberOfLines={2}>
              {item.player_name || "—"}
            </Text>
            <Text style={styles.trendSub} numberOfLines={2}>
              {sub}
            </Text>
            <Text style={styles.trendPrice}>
              {formatPrice(item.price_cents, item.currency)}
            </Text>
          </View>
        </Pressable>
      );
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const initials = listingInitials(item.player_name);
      const uri =
        item.image_urls &&
        Array.isArray(item.image_urls) &&
        item.image_urls[0]
          ? item.image_urls[0]
          : null;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.rowCard,
            pressed ? styles.rowCardPressed : null,
          ]}
          onPress={() =>
            navigation.navigate("ListingDetail", { id: item.id })
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.player_name}, ${formatPrice(
            item.price_cents,
            item.currency
          )}`}
        >
          {uri ? (
            <Image source={{ uri }} style={styles.rowThumbImg} />
          ) : (
            <View style={styles.rowThumb}>
              <Text style={styles.thumbText}>{initials}</Text>
            </View>
          )}
          <View style={styles.rowBody}>
            <View style={styles.rowBodyTop}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.player_name}
                <Text style={styles.rowYear}> · {item.year}</Text>
              </Text>
              {item.is_favorited ? (
                <Text style={styles.favMuted}>{t("home.favoritedBadge")}</Text>
              ) : null}
            </View>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {item.sport} · {item.manufacturer}
            </Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {item.card_type} · {item.condition_grade}
            </Text>
            <View style={styles.rowFooter}>
              <Text style={styles.rowPrice}>
                {formatPrice(item.price_cents, item.currency)}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [navigation, t]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScroll}
    >
      {sortOptions.map((s) => {
        const on = appliedSort === s.key;
        return (
          <Pressable
            key={s.key}
            style={({ pressed }) => [
              styles.chip,
              on ? styles.chipOn : null,
              pressed ? styles.chipPressed : null,
            ]}
            onPress={() => setAppliedSort(s.key)}
          >
            <Text style={on ? styles.chipTextOn : styles.chipText}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        style={({ pressed }) => [
          styles.chip,
          styles.chipMore,
          hasAdvancedFilters ? styles.chipMoreActive : null,
          pressed ? styles.chipPressed : null,
        ]}
        onPress={openFilterSheet}
      >
        <Text
          style={[
            styles.chipText,
            hasAdvancedFilters ? styles.chipTextOn : null,
          ]}
        >
          {t("home.moreFilters")}
        </Text>
      </Pressable>
    </ScrollView>
  );

  const listHeader = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.dashHeader}>
        <Text style={styles.dashLogo}>{t("home.dashboardTitle")}</Text>
        <View style={styles.dashHeaderRight}>
          <Pressable
            onPress={() => navigation.navigate("CreateListing")}
            style={styles.dashHeaderBtn}
            hitSlop={8}
          >
            <Text style={styles.dashHeaderBtnText}>{t("nav.new")}</Text>
          </Pressable>
          <Pressable
            onPress={openProfile}
            style={styles.profileBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.profile")}
          >
            <Ionicons name="person-outline" size={22} color={TEXT_DARK} />
          </Pressable>
        </View>
      </View>

      <View style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>{t("home.portfolioLabel")}</Text>
        <Text style={styles.portfolioValue}>
          {formatPortfolioEur(portfolioSumCents, i18n.language)}
        </Text>
        <View style={styles.trendPill}>
          <Ionicons name="trending-up" size={14} color={GREEN_TREND} />
          <Text style={styles.trendPillText}> {t("home.portfolioTrend")}</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{t("home.trendingTitle")}</Text>
        <Pressable onPress={scrollToAllOffers} hitSlop={8}>
          <Text style={styles.viewAll}>{t("home.viewAll")}</Text>
        </Pressable>
      </View>

      {trendingItems.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendScroll}
        >
          {trendingItems.map((it) => renderTrendingCard(it))}
        </ScrollView>
      ) : null}

      <Text style={[styles.sectionTitle, styles.sectionOffers]}>
        {t("home.allOffers")}
      </Text>
      <Text style={styles.hitLine}>
        <Text style={styles.hitNum}>{total}</Text>
        <Text style={styles.hitRest}> {t("home.statHits")}</Text>
      </Text>

      <View style={styles.headerPad}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.searchInput}
          placeholder={t("home.searchPh")}
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />

        {filterChips}
      </View>
    </View>
  );

  const listEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={TEXT_DARK} size="large" />
          <Text style={styles.loadingHint}>{t("home.loadingHint")}</Text>
        </View>
      );
    }
    if (error) {
      return null;
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>{t("home.emptyTitle")}</Text>
        <Text style={styles.emptySub}>{t("home.emptySub")}</Text>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <StatusBar style="dark" />
      <FlatList
        ref={flatListRef}
        data={listings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEXT_DARK}
            colors={[TEXT_DARK]}
          />
        }
        keyboardShouldPersistTaps="handled"
      />

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeSheet} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalSheetWrap}
          >
            <View
              style={[
                styles.sheet,
                { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              ]}
            >
              <Text style={styles.sheetTitle}>{t("home.moreFilters")}</Text>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.sheetScroll}
              >
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.sportPh")}
                  placeholderTextColor={MUTED}
                  value={sport}
                  onChangeText={setSport}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.manufacturerPh")}
                  placeholderTextColor={MUTED}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.teamPh")}
                  placeholderTextColor={MUTED}
                  value={team}
                  onChangeText={setTeam}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.cardNumberPh")}
                  placeholderTextColor={MUTED}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <View style={styles.sheetRow2}>
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfLeft]}
                    placeholder={t("home.yearFromPh")}
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                    value={yearFrom}
                    onChangeText={setYearFrom}
                  />
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfRight]}
                    placeholder={t("home.yearToPh")}
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                    value={yearTo}
                    onChangeText={setYearTo}
                  />
                </View>
                <View style={styles.sheetRow2}>
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfLeft]}
                    placeholder={t("home.minEurPh")}
                    placeholderTextColor={MUTED}
                    keyboardType="decimal-pad"
                    value={minEur}
                    onChangeText={setMinEur}
                  />
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfRight]}
                    placeholder={t("home.maxEurPh")}
                    placeholderTextColor={MUTED}
                    keyboardType="decimal-pad"
                    value={maxEur}
                    onChangeText={setMaxEur}
                  />
                </View>
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.conditionPh")}
                  placeholderTextColor={MUTED}
                  value={conditionGrade}
                  onChangeText={setConditionGrade}
                />
                <Text style={styles.sheetTypeHint}>{t("home.cardTypeLabel")}</Text>
                <View style={styles.typeWrap}>
                  <Pressable
                    style={cardType === "" ? styles.typeChipOn : styles.typeChip}
                    onPress={() => setCardType("")}
                  >
                    <Text
                      style={
                        cardType === ""
                          ? styles.typeChipTextOn
                          : styles.typeChipText
                      }
                    >
                      {t("home.all")}
                    </Text>
                  </Pressable>
                  {CARD_TYPES.map((ct) => (
                    <Pressable
                      key={ct}
                      style={
                        cardType === ct ? styles.typeChipOn : styles.typeChip
                      }
                      onPress={() => setCardType(ct)}
                    >
                      <Text
                        style={
                          cardType === ct
                            ? styles.typeChipTextOn
                            : styles.typeChipText
                        }
                      >
                        {ct}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetDone,
                  pressed ? styles.sheetDonePressed : null,
                ]}
                onPress={closeSheet}
              >
                <Text style={styles.sheetDoneText}>{t("home.sheetDone")}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG },
  dashHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dashLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT_DARK,
    letterSpacing: 0.5,
  },
  dashHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dashHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginRight: 12,
  },
  dashHeaderBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  portfolioCard: {
    marginHorizontal: 20,
    backgroundColor: CARD_DARK,
    borderRadius: 28,
    padding: 22,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  portfolioLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 34,
    fontWeight: "800",
    color: WHITE,
    letterSpacing: -0.5,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "rgba(0,200,83,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  trendPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: GREEN_TREND,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT_DARK,
    letterSpacing: 1.2,
  },
  sectionOffers: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  hitLine: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  hitNum: {
    fontSize: 13,
    fontWeight: "700",
    color: SUB,
    fontVariant: ["tabular-nums"],
  },
  hitRest: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "500",
  },
  trendScroll: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  trendCard: {
    width: 280,
    flexDirection: "row",
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  trendCardPressed: { opacity: 0.92 },
  trendThumbImg: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  trendThumbPlaceholder: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  trendCardBody: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
    minHeight: 96,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_DARK,
    lineHeight: 20,
  },
  trendSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
    lineHeight: 18,
  },
  trendPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: TEXT_DARK,
    marginTop: 8,
  },
  headerPad: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: WHITE,
  },
  chipMore: {
    paddingHorizontal: 12,
  },
  chipMoreActive: {
    backgroundColor: CHIP_BG,
  },
  chipOn: {
    backgroundColor: CHIP_BG,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 13,
    color: SUB,
    fontWeight: "600",
  },
  chipTextOn: {
    color: TEXT_DARK,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    flexGrow: 1,
  },
  rowCard: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  rowCardPressed: { opacity: 0.94 },
  rowThumb: {
    width: 64,
    height: 88,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e8",
  },
  rowThumbImg: {
    width: 64,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  thumbText: {
    color: SUB,
    fontSize: 18,
    fontWeight: "800",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },
  rowBodyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_DARK,
    flex: 1,
    marginRight: 8,
    lineHeight: 21,
  },
  rowYear: {
    color: MUTED,
    fontWeight: "600",
  },
  favMuted: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 14,
    color: SUB,
    marginTop: 6,
    fontWeight: "500",
  },
  rowSub: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
  },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  rowPrice: {
    fontSize: 18,
    color: TEXT_DARK,
    fontWeight: "800",
    letterSpacing: 0.15,
    fontVariant: ["tabular-nums"],
  },
  emptyWrap: {
    paddingVertical: 40,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingHint: {
    color: MUTED,
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyTitle: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
    color: MUTED,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheetWrap: {
    width: "100%",
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: "88%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  sheetTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetField: {
    fontSize: 17,
    color: TEXT_DARK,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  sheetRow2: {
    flexDirection: "row",
  },
  sheetHalfLeft: {
    flex: 1,
    marginRight: 10,
  },
  sheetHalfRight: {
    flex: 1,
  },
  sheetTypeHint: {
    fontSize: 13,
    color: MUTED,
    marginTop: 14,
    marginBottom: 10,
    fontWeight: "500",
  },
  typeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: CHIP_BG,
  },
  typeChipOn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: TEXT_DARK,
  },
  typeChipText: { fontSize: 13, color: SUB, fontWeight: "600" },
  typeChipTextOn: { fontSize: 13, color: WHITE, fontWeight: "700" },
  sheetDone: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetDonePressed: {
    opacity: 0.75,
  },
  sheetDoneText: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: "700",
  },
});
