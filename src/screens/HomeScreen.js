import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CARD_TYPES } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Layout, Theme } from "../theme";
import { getListingThumbnailUri } from "../utils/listingImages";
import { profileInitial } from "../utils/profileInitial";
import { resolveUserAvatarUri } from "../utils/resolveUserAvatarUri";

const POLL_MS = 30000;
const SEARCH_DEBOUNCE_MS = 400;

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

function greetingFirstName(user) {
  if (!user || typeof user !== "object") {
    return "";
  }
  const dn = String(user.display_name || "").trim();
  if (dn) {
    return dn.split(/\s+/)[0] || dn;
  }
  const em = String(user.email || "").trim();
  if (em.includes("@")) {
    return em.split("@")[0] || "";
  }
  return "";
}

/** Morgen 5–11, Tag 11–17, Abend 17–22, Nacht sonst */
function getDayPart() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) {
    return "morning";
  }
  if (h >= 11 && h < 17) {
    return "midday";
  }
  if (h >= 17 && h < 22) {
    return "evening";
  }
  return "night";
}

export default function HomeScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const screenPad = useMemo(
    () => ({
      paddingLeft: Math.max(insets.left, Layout.screenGutter),
      paddingRight: Math.max(insets.right, Layout.screenGutter),
    }),
    [insets.left, insets.right],
  );

  const listBottomPad = useMemo(
    () => insets.bottom + Layout.tabBarScrollExtra,
    [insets.bottom],
  );

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
  /** @type {'public' | 'private'} */
  const [feedScope, setFeedScope] = useState("public");
  const [meUser, setMeUser] = useState(null);
  const [timeTick, setTimeTick] = useState(0);
  /** Ungefilterte „Entdecken“-Karten (immer neueste), unabhängig von Suche/Filtern. */
  const [featuredStrip, setFeaturedStrip] = useState([]);

  const loadFeatured = useCallback(async () => {
    try {
      const data = await api("/api/listings?limit=8", token ? { token } : {});
      setFeaturedStrip(data.listings || []);
    } catch {
      setFeaturedStrip([]);
    }
  }, [token]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    if (!token) {
      setFeedScope("public");
    }
  }, [token]);

  useEffect(() => {
    if (token && meUser && !meUser.private_market_access) {
      setFeedScope("public");
    }
  }, [token, meUser?.private_market_access]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeTick((n) => n + 1);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadFeatured();
      (async () => {
        if (!token) {
          if (!cancelled) {
            setMeUser(null);
          }
          return;
        }
        try {
          const data = await api("/api/users/me", { token });
          if (!cancelled && data && data.user) {
            setMeUser(data.user);
          }
        } catch {
          if (!cancelled) {
            setMeUser(null);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token, loadFeatured])
  );

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
      if (feedScope === "private") {
        q.set("private_market", "1");
      }
      const qs = q.toString();
      const path = `/api/listings?${qs}`;
      const opts =
        feedScope === "private"
          ? { token }
          : token
            ? { token }
            : {};
      const data = await api(path, opts);
      const list = data.listings || [];
      const tot = data.total || 0;
      setListings(list);
      setTotal(tot);
    } catch (e) {
      setListings([]);
      setTotal(0);
      setError(e.message || t("common.error"));
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
    feedScope,
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
    loadFeatured();
    load();
  }

  const portfolioSumCents = useMemo(
    () =>
      listings.reduce((s, x) => s + (Number(x.price_cents) || 0), 0),
    [listings]
  );

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

  const toggleFavorite = useCallback(
    async (item) => {
      if (!token) {
        Alert.alert("", t("home.signInToSave"));
        return;
      }
      const next = !item.is_favorited;
      try {
        await api(`/api/favorites/${item.id}`, {
          token,
          method: next ? "POST" : "DELETE",
        });
        setListings((prev) =>
          prev.map((l) =>
            l.id === item.id ? { ...l, is_favorited: next } : l
          )
        );
        setFeaturedStrip((prev) =>
          prev.map((l) =>
            l.id === item.id ? { ...l, is_favorited: next } : l
          )
        );
      } catch (e) {
        Alert.alert(t("common.error"), e.message || "");
      }
    },
    [token, t]
  );

  const openMessage = useCallback(
    async (item) => {
      if (!token) {
        Alert.alert("", t("home.signInToMessage"));
        return;
      }
      try {
        const data = await api("/api/conversations", {
          token,
          method: "POST",
          body: { listing_id: item.id },
        });
        const cid = data.conversation && data.conversation.id;
        if (cid) {
          const parent = navigation.getParent();
          parent?.navigate("Messages", { conversationId: cid });
        }
      } catch (e) {
        Alert.alert(t("common.error"), e.message || "");
      }
    },
    [token, t, navigation]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const thumb = getListingThumbnailUri(item);

      return (
        <View style={styles.rowCardWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.rowCardMain,
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
            <Image source={{ uri: thumb }} style={styles.rowThumbImg} />
            <View style={styles.rowBody}>
              <View style={styles.rowTitleRow}>
                <Text
                  style={[styles.rowTitle, styles.rowTitleFlex]}
                  numberOfLines={2}
                >
                  {item.player_name}
                  <Text style={styles.rowYear}> · {item.year}</Text>
                </Text>
                {item.is_private_market ? (
                  <View style={styles.privateBadge}>
                    <Text style={styles.privateBadgeText}>
                      {t("listing.privateBadge")}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.sport} · {item.manufacturer}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.card_type} · {item.condition_grade}
              </Text>
              <Text style={styles.rowPrice}>
                {formatPrice(item.price_cents, item.currency)}
              </Text>
            </View>
          </Pressable>
          <View style={styles.rowQuickActions}>
            <Pressable
              onPress={() => toggleFavorite(item)}
              style={styles.rowQuickBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("listing.favoriteAdd")}
            >
              <Ionicons
                name={item.is_favorited ? "heart" : "heart-outline"}
                size={21}
                color={item.is_favorited ? "#b91c1c" : Theme.muted}
              />
            </Pressable>
            <Pressable
              onPress={() => openMessage(item)}
              style={styles.rowQuickBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t("listing.contact")}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={Theme.muted}
              />
            </Pressable>
          </View>
        </View>
      );
    },
    [navigation, t, toggleFavorite, openMessage]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  const filterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScrollInCard}
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
          hasAdvancedFilters ? styles.chipOn : null,
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

  const privateAccess = Boolean(meUser?.private_market_access);

  const greetingName = greetingFirstName(meUser);
  const greetingLine = useMemo(() => {
    const part = getDayPart();
    const partSuffix = part.charAt(0).toUpperCase() + part.slice(1);
    const key =
      greetingName.length > 0
        ? `home.greeting${partSuffix}`
        : `home.greeting${partSuffix}Short`;
    return t(key, { name: greetingName });
  }, [t, greetingName, timeTick]);

  const dashAvatarUri = meUser ? resolveUserAvatarUri(meUser.avatar_url) : null;
  const dashAvatarLetter = profileInitial(meUser?.display_name, meUser?.email);

  const highlightItems = useMemo(() => {
    if (feedScope === "private") {
      return [];
    }
    return featuredStrip.length > 0
      ? featuredStrip.slice(0, 4)
      : listings.slice(0, 4);
  }, [feedScope, featuredStrip, listings]);
  const highlightTitleKey =
    featuredStrip.length > 0
      ? "home.highlightDiscover"
      : "home.highlightTrending";

  const listHeader = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.dashHeaderCard}>
        <View style={styles.dashTop}>
        <Pressable
          onPress={openProfile}
          style={({ pressed }) => [
            styles.dashAvatarWrap,
            pressed ? styles.dashAvatarPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("tabs.profile")}
        >
          {dashAvatarUri ? (
            <Image
              source={{ uri: dashAvatarUri }}
              style={styles.dashAvatarImg}
            />
          ) : meUser ? (
            <Text style={styles.dashAvatarLetter}>{dashAvatarLetter}</Text>
          ) : (
            <Ionicons name="person-outline" size={22} color={Theme.sub} />
          )}
        </Pressable>
        <View style={styles.dashTopCenter}>
          <Text style={styles.dashGreeting} numberOfLines={2}>
            {greetingLine}
          </Text>
          <Text style={styles.dashSub} numberOfLines={1}>
            {t("home.dashboardSubtitle")}
          </Text>
        </View>
        {privateAccess ? (
          <Pressable
            style={({ pressed }) => [
              styles.clubGlyph,
              feedScope === "private" ? styles.clubGlyphActive : null,
              pressed ? styles.clubGlyphPressed : null,
            ]}
            onPress={() =>
              setFeedScope((s) => (s === "public" ? "private" : "public"))
            }
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("home.clubLensA11y")}
            accessibilityHint={t("home.clubLensA11yHint")}
            accessibilityState={{ selected: feedScope === "private" }}
          >
            <Ionicons
              name={feedScope === "private" ? "sparkles" : "sparkles-outline"}
              size={18}
              color={
                feedScope === "private"
                  ? Theme.accentGold
                  : "rgba(142,142,142,0.85)"
              }
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate("CreateListing")}
          style={({ pressed }) => [
            styles.dashPlusBtn,
            pressed ? styles.dashPlusBtnPressed : null,
            privateAccess ? styles.dashPlusBtnAfterClub : null,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("nav.newListing")}
        >
          <Ionicons name="add" size={26} color={Theme.onWhite} />
        </Pressable>
      </View>
      </View>

      <LinearGradient
        colors={["#2a2b34", Theme.heroBg, "#121318"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceCardTitleRow}>
          <Text style={styles.balanceLabel}>{t("home.portfolioLabel")}</Text>
          <View style={styles.balanceTrendPill}>
            <Ionicons name="trending-up" size={13} color="#a7f3d0" />
            <Text style={styles.balanceTrendText}>
              {t("home.portfolioTrend")}
            </Text>
          </View>
        </View>
        <Text style={styles.balanceValue}>
          {formatPortfolioEur(portfolioSumCents, i18n.language)}
        </Text>
        <Text style={styles.balanceHint} numberOfLines={2}>
          {t("home.portfolioHint")}
        </Text>
      </LinearGradient>

      <View style={styles.dashDivider} />

      <View style={styles.searchSectionWrap}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.searchBarPill}>
          <View style={styles.searchFieldRow}>
            <Ionicons
              name="search-outline"
              size={20}
              color={Theme.muted}
              style={styles.searchLeadingIcon}
            />
            <TextInput
              style={styles.searchInputInner}
              placeholder={t("home.searchPh")}
              placeholderTextColor={Theme.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        </View>
        {filterChips}
        <Text style={styles.searchMetaLine}>
          {t("home.offersCountLabel", { count: total })}
        </Text>
      </View>

      {highlightItems.length > 0 ? (
        <View style={styles.highlightSection}>
          <Text style={styles.highlightTitle}>{t(highlightTitleKey)}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightScroll}
          >
            {highlightItems.map((item) => {
              const thumb = getListingThumbnailUri(item);
              return (
                <Pressable
                  key={String(item.id)}
                  style={({ pressed }) => [
                    styles.highlightCard,
                    pressed ? styles.highlightCardPressed : null,
                  ]}
                  onPress={() =>
                    navigation.navigate("ListingDetail", { id: item.id })
                  }
                >
                  <Image
                    source={{ uri: thumb }}
                    style={styles.highlightThumb}
                  />
                  <Text style={styles.highlightName} numberOfLines={1}>
                    {item.player_name}
                  </Text>
                  <Text style={styles.highlightPrice}>
                    {formatPrice(item.price_cents, item.currency)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={Theme.text} size="large" />
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
        contentContainerStyle={[
          styles.listContent,
          screenPad,
          { paddingBottom: listBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.text}
            colors={[Theme.text]}
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
                {
                  paddingHorizontal: Layout.screenGutter,
                  paddingBottom: Math.max(insets.bottom, 16) + 8,
                },
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
                  placeholderTextColor={Theme.muted}
                  value={sport}
                  onChangeText={setSport}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.manufacturerPh")}
                  placeholderTextColor={Theme.muted}
                  value={manufacturer}
                  onChangeText={setManufacturer}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.teamPh")}
                  placeholderTextColor={Theme.muted}
                  value={team}
                  onChangeText={setTeam}
                />
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.cardNumberPh")}
                  placeholderTextColor={Theme.muted}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />
                <View style={styles.sheetRow2}>
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfLeft]}
                    placeholder={t("home.yearFromPh")}
                    placeholderTextColor={Theme.muted}
                    keyboardType="number-pad"
                    value={yearFrom}
                    onChangeText={setYearFrom}
                  />
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfRight]}
                    placeholder={t("home.yearToPh")}
                    placeholderTextColor={Theme.muted}
                    keyboardType="number-pad"
                    value={yearTo}
                    onChangeText={setYearTo}
                  />
                </View>
                <View style={styles.sheetRow2}>
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfLeft]}
                    placeholder={t("home.minEurPh")}
                    placeholderTextColor={Theme.muted}
                    keyboardType="decimal-pad"
                    value={minEur}
                    onChangeText={setMinEur}
                  />
                  <TextInput
                    style={[styles.sheetField, styles.sheetHalfRight]}
                    placeholder={t("home.maxEurPh")}
                    placeholderTextColor={Theme.muted}
                    keyboardType="decimal-pad"
                    value={maxEur}
                    onChangeText={setMaxEur}
                  />
                </View>
                <TextInput
                  style={styles.sheetField}
                  placeholder={t("home.conditionPh")}
                  placeholderTextColor={Theme.muted}
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
  wrap: { flex: 1, backgroundColor: Theme.bg },
  dashHeaderCard: {
    backgroundColor: Theme.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dashTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 0,
  },
  dashAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Theme.surface,
    borderWidth: 2,
    borderColor: Theme.soft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dashAvatarPressed: {
    opacity: 0.88,
  },
  dashAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  dashAvatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.text,
  },
  dashTopCenter: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
    paddingTop: 0,
  },
  dashGreeting: {
    fontSize: 21,
    fontWeight: "700",
    color: Theme.text,
    letterSpacing: -0.45,
    lineHeight: 27,
  },
  dashSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
    color: Theme.muted,
    lineHeight: 16,
    opacity: 0.92,
  },
  balanceCard: {
    marginTop: 0,
    marginBottom: 4,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  balanceCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  balanceTrendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  balanceTrendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#a7f3d0",
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Theme.heroText,
    letterSpacing: -0.8,
    fontVariant: ["tabular-nums"],
  },
  balanceHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 8,
    lineHeight: 17,
  },
  clubGlyph: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginRight: 6,
  },
  clubGlyphActive: {
    borderColor: "rgba(201, 165, 116, 0.35)",
    backgroundColor: "rgba(201, 165, 116, 0.08)",
  },
  clubGlyphPressed: {
    opacity: 0.88,
  },
  dashPlusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.text,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  dashPlusBtnAfterClub: {
    marginLeft: 0,
  },
  dashPlusBtnPressed: {
    opacity: 0.88,
  },
  dashDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.line,
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.85,
  },
  portfolioDayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  portfolioDayText: {
    fontSize: 12,
    color: "#86efac",
    fontWeight: "600",
    marginRight: 8,
    flexShrink: 1,
  },
  sparkline: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 28,
  },
  sparkBar: {
    width: 4,
    marginHorizontal: 1.5,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 1,
    maxWidth: "48%",
  },
  trendPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#86efac",
    marginLeft: 4,
    flexShrink: 1,
  },
  highlightSection: {
    marginBottom: 12,
    marginTop: 14,
  },
  highlightTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.muted,
    marginBottom: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  highlightScroll: {
    paddingRight: 8,
    paddingBottom: 4,
  },
  highlightCard: {
    width: 122,
    marginRight: 12,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightCardPressed: {
    opacity: 0.92,
  },
  highlightThumb: {
    width: "100%",
    height: 76,
    borderRadius: 10,
    backgroundColor: Theme.card,
  },
  highlightName: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.text,
    marginTop: 6,
  },
  highlightPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: Theme.text,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  searchSectionWrap: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },
  rowTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  privateBadge: {
    marginLeft: 8,
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(201, 165, 116, 0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(201, 165, 116, 0.45)",
  },
  privateBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#8a7036",
    letterSpacing: 0.35,
  },
  /** Nur die Suchzeile als Pille — Chips und Meta liegen außerhalb, wirkt luftiger. */
  searchBarPill: {
    backgroundColor: Theme.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  searchFieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchLeadingIcon: {
    marginRight: 8,
  },
  searchInputInner: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Theme.text,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingRight: 4,
  },
  chipScrollInCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 2,
    paddingRight: 4,
  },
  searchMetaLine: {
    marginTop: 6,
    marginBottom: 2,
    fontSize: 12,
    fontWeight: "600",
    color: Theme.muted,
    letterSpacing: 0.12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: Theme.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  chipMore: {
    paddingHorizontal: 12,
  },
  chipOn: {
    backgroundColor: Theme.text,
    borderColor: Theme.text,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 12,
    color: Theme.sub,
    fontWeight: "600",
  },
  chipTextOn: {
    color: Theme.heroText,
    fontWeight: "700",
  },
  listContent: {
    flexGrow: 1,
  },
  rowCardWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Theme.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rowCardMain: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    minWidth: 0,
  },
  rowCardPressed: { opacity: 0.94 },
  rowThumbImg: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: Theme.card,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.text,
    lineHeight: 21,
  },
  rowYear: {
    color: Theme.muted,
    fontWeight: "600",
  },
  rowMeta: {
    fontSize: 13,
    color: Theme.sub,
    marginTop: 4,
    fontWeight: "500",
  },
  rowSub: {
    fontSize: 12,
    color: Theme.muted,
    marginTop: 3,
  },
  rowPrice: {
    fontSize: 17,
    color: Theme.text,
    fontWeight: "800",
    letterSpacing: 0.15,
    fontVariant: ["tabular-nums"],
    marginTop: 8,
  },
  rowQuickActions: {
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: Theme.line,
  },
  rowQuickBtn: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    paddingVertical: 40,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingHint: {
    color: Theme.muted,
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyTitle: {
    color: Theme.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
    color: Theme.muted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  errorText: {
    color: Theme.error,
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
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheetWrap: {
    width: "100%",
  },
  sheet: {
    backgroundColor: Theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "88%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.line,
  },
  sheetTitle: {
    color: Theme.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sheetScroll: {
    maxHeight: 420,
  },
  sheetField: {
    fontSize: 17,
    color: Theme.text,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
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
    color: Theme.muted,
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
    backgroundColor: Theme.soft,
  },
  typeChipOn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: Theme.heroBg,
  },
  typeChipText: { fontSize: 13, color: Theme.sub, fontWeight: "600" },
  typeChipTextOn: { fontSize: 13, color: Theme.heroText, fontWeight: "700" },
  sheetDone: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetDonePressed: {
    opacity: 0.75,
  },
  sheetDoneText: {
    color: Theme.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
