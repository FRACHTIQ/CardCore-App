import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import {
  api,
  getListingAnalytics,
  getOffers,
  postOffer,
  acceptOffer,
  rejectOffer,
} from "../api";
import { useAuth } from "../AuthContext";

const { width: WIN_W } = Dimensions.get("window");
const IMG_H = Math.min(380, WIN_W * 0.95);

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

function MiniPriceChart({ points, t }) {
  if (!points || points.length === 0) {
    return (
      <Text style={styles.chartEmpty}>{t("listing.chartEmpty")}</Text>
    );
  }
  const vals = points.map((p) => p.price_cents || 0);
  const max = Math.max(...vals, 1);
  return (
    <View style={styles.chartRow}>
      {points.map((p, i) => {
        const h = Math.max(6, Math.round((p.price_cents / max) * 48));
        return (
          <View key={String(i)} style={styles.chartBarWrap}>
            <View style={[styles.chartBar, { height: h }]} />
          </View>
        );
      })}
    </View>
  );
}

export default function ListingDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const id = route.params && route.params.id ? route.params.id : null;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favBusy, setFavBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);
  const [meUser, setMeUser] = useState(null);
  const [chartRange, setChartRange] = useState("30d");
  const [chartPoints, setChartPoints] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [offerEuro, setOfferEuro] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const [offers, setOffers] = useState([]);
  const [buyerOffer, setBuyerOffer] = useState(null);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setError("");
    setLoading(true);
    try {
      const opts = token ? { token } : {};
      const data = await api(`/api/listings/${id}`, opts);
      const row = data.listing;
      setListing(row);
      if (row && typeof row.is_favorited === "boolean") {
        setIsFavorite(row.is_favorited);
      } else {
        setIsFavorite(false);
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [id, token, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setMeUser(null);
        return;
      }
      try {
        const data = await api("/api/users/me", { token });
        if (!cancelled && data?.user) {
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
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !id) {
        setChartPoints([]);
        return;
      }
      setChartLoading(true);
      try {
        const data = await getListingAnalytics(token, id, chartRange);
        if (!cancelled) {
          setChartPoints(data.points || []);
        }
      } catch {
        if (!cancelled) {
          setChartPoints([]);
        }
      } finally {
        if (!cancelled) {
          setChartLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id, chartRange]);

  const loadOffers = useCallback(async () => {
    if (!token || !id) {
      return;
    }
    try {
      const data = await getOffers(token, "seller");
      const list = (data.offers || []).filter(
        (o) => Number(o.listing_id) === Number(id)
      );
      setOffers(list);
    } catch {
      setOffers([]);
    }
  }, [token, id]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const loadBuyerOffer = useCallback(async () => {
    if (!token || !id) {
      setBuyerOffer(null);
      return;
    }
    try {
      const data = await getOffers(token, "buyer", { limit: 80 });
      const list = data.offers || [];
      const mine = list.find((o) => Number(o.listing_id) === Number(id));
      setBuyerOffer(mine || null);
    } catch {
      setBuyerOffer(null);
    }
  }, [token, id]);

  useEffect(() => {
    loadBuyerOffer();
  }, [loadBuyerOffer]);

  const isSeller = useMemo(
    () =>
      Boolean(
        meUser && listing && Number(meUser.id) === Number(listing.seller_id)
      ),
    [meUser, listing]
  );

  const canBuyFlow = Boolean(
    token && meUser?.is_verified && listing?.status === "ACTIVE"
  );

  const pendingBuyerOffer =
    buyerOffer && String(buyerOffer.status) === "PENDING";

  async function toggleFavorite() {
    if (!token || !listing) {
      return;
    }
    setFavBusy(true);
    try {
      if (isFavorite) {
        await api(`/api/favorites/${listing.id}`, {
          token,
          method: "DELETE",
        });
        setIsFavorite(false);
        setListing((prev) => (prev ? { ...prev, is_favorited: false } : prev));
      } else {
        await api(`/api/favorites/${listing.id}`, {
          token,
          method: "POST",
        });
        setIsFavorite(true);
        setListing((prev) => (prev ? { ...prev, is_favorited: true } : prev));
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setFavBusy(false);
    }
  }

  async function startChat() {
    if (!token || !listing) {
      return;
    }
    if (!meUser?.is_verified) {
      Alert.alert("", t("listing.needVerified"));
      return;
    }
    setChatBusy(true);
    try {
      const data = await api("/api/conversations", {
        token,
        method: "POST",
        body: { listing_id: listing.id },
      });
      const cid = data.conversation && data.conversation.id;
      if (cid) {
        navigation.navigate("Messages", {
          conversationId: cid,
        });
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setChatBusy(false);
    }
  }

  function onBuy() {
    Alert.alert(t("listing.buyTitle"), t("listing.buyBody"));
  }

  function onTrade() {
    Alert.alert(t("listing.tradeTitle"), t("listing.tradeBody"));
  }

  async function submitOffer() {
    if (!token || !listing) {
      return;
    }
    if (!meUser?.is_verified) {
      Alert.alert("", t("listing.needVerified"));
      return;
    }
    const pe = String(offerEuro).replace(",", ".").trim();
    const euros = Number(pe);
    if (!Number.isFinite(euros) || euros <= 0) {
      Alert.alert("", t("listing.offerInvalid"));
      return;
    }
    const priceCents = Math.round(euros * 100);
    setOfferBusy(true);
    try {
      await postOffer(token, {
        listing_id: listing.id,
        price_cents: priceCents,
        message: "",
      });
      setOfferEuro("");
      loadBuyerOffer();
      Alert.alert("", t("listing.offerSent"));
    } catch (e) {
      Alert.alert(t("common.error"), e.message || "");
    } finally {
      setOfferBusy(false);
    }
  }

  async function onAcceptOffer(offerId) {
    if (!token) {
      return;
    }
    try {
      await acceptOffer(token, offerId);
      Alert.alert("", t("listing.offerAccepted"));
      load();
      loadOffers();
    } catch (e) {
      Alert.alert(t("common.error"), e.message || "");
    }
  }

  async function onRejectOffer(offerId) {
    if (!token) {
      return;
    }
    try {
      await rejectOffer(token, offerId);
      loadOffers();
    } catch (e) {
      Alert.alert(t("common.error"), e.message || "");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Theme.text} />
      </View>
    );
  }

  if (error && !listing) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Text style={styles.muted}>{t("listing.notFound")}</Text>
      </View>
    );
  }

  const imgs = Array.isArray(listing.image_urls) ? listing.image_urls : [];
  const mv =
    listing.market_value_cents != null
      ? formatPrice(listing.market_value_cents, listing.currency)
      : null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />

      {imgs.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageStrip}
        >
          {imgs.map((u, i) => (
            <Image
              key={String(i)}
              source={{ uri: u }}
              style={[styles.heroImage, { width: WIN_W }]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.imagePlaceholder, { width: WIN_W }]}>
          <Text style={styles.muted}>{t("listing.noImages")}</Text>
        </View>
      )}

      <Text style={styles.player}>{listing.player_name}</Text>
      <Text style={styles.price}>
        {formatPrice(listing.price_cents, listing.currency)}
      </Text>
      {mv ? (
        <Text style={styles.marketLine}>
          {t("listing.marketValue")}: {mv}
          {listing.market_value_source
            ? ` · ${listing.market_value_source}`
            : ""}
        </Text>
      ) : null}

      {token ? (
        <View style={styles.rangeRow}>
          {["7d", "30d", "90d"].map((r) => {
            const rangeLabel =
              r === "7d"
                ? t("listing.chartRange7d")
                : r === "30d"
                  ? t("listing.chartRange30d")
                  : t("listing.chartRange90d");
            return (
            <Pressable
              key={r}
              style={[
                styles.rangeChip,
                chartRange === r ? styles.rangeChipOn : null,
              ]}
              onPress={() => setChartRange(r)}
            >
              <Text
                style={
                  chartRange === r ? styles.rangeChipTextOn : styles.rangeChipText
                }
              >
                {rangeLabel}
              </Text>
            </Pressable>
            );
          })}
        </View>
      ) : null}
      {token ? (
        chartLoading ? (
          <ActivityIndicator color={Theme.text} style={{ marginVertical: 8 }} />
        ) : (
          <MiniPriceChart points={chartPoints} t={t} />
        )
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.legalBox}>{t("listing.legalDisclaimer")}</Text>

      {!meUser?.is_verified && token ? (
        <View style={styles.verifyBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={Theme.error} />
          <Text style={styles.verifyBannerText}>{t("listing.needVerified")}</Text>
        </View>
      ) : null}

      {listing.is_graded ? (
        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>{t("listing.gradingTitle")}</Text>
          <Text style={styles.metaText}>
            {listing.grading_company || "—"} · {listing.grading_grade || "—"}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaCard}>
        <Text style={styles.metaTitle}>{t("listing.shippingTitle")}</Text>
        <Text style={styles.metaText}>
          {listing.shipping_included
            ? t("listing.shippingIncluded")
            : t("listing.shippingExtra")}
          {listing.shipping_cost_cents != null
            ? ` · ${formatPrice(listing.shipping_cost_cents, listing.currency)}`
            : ""}
        </Text>
      </View>

      <View style={styles.actions}>
        {token ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={toggleFavorite}
            disabled={favBusy}
          >
            <Text style={styles.secondaryBtnText}>
              {isFavorite
                ? t("listing.favoriteRemove")
                : t("listing.favoriteAdd")}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.outlineBtn} onPress={onTrade}>
          <Text style={styles.outlineBtnText}>{t("listing.trade")}</Text>
        </Pressable>
        {token ? (
          <Pressable style={styles.primaryBtn} onPress={onBuy}>
            <Text style={styles.primaryBtnText}>{t("listing.buy")}</Text>
          </Pressable>
        ) : null}
        {token ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={startChat}
            disabled={chatBusy}
          >
            <Text style={styles.primaryBtnText}>{t("listing.contact")}</Text>
          </Pressable>
        ) : null}
      </View>

      {token &&
      !isSeller &&
      listing.status === "ACTIVE" &&
      canBuyFlow &&
      pendingBuyerOffer ? (
        <View style={styles.offerBox}>
          <Text style={styles.offerTitle}>{t("listing.myOffer")}</Text>
          <Text style={styles.offerRowText}>
            {formatPrice(buyerOffer.price_cents, buyerOffer.currency)} ·{" "}
            {buyerOffer.status}
          </Text>
          <Pressable onPress={onWithdrawMyOffer} style={styles.offerWithdrawBtn}>
            <Text style={styles.offerWithdrawText}>
              {t("listing.offerWithdraw")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {token &&
      !isSeller &&
      listing.status === "ACTIVE" &&
      canBuyFlow &&
      !pendingBuyerOffer ? (
        <View style={styles.offerBox}>
          <Text style={styles.offerTitle}>{t("listing.offerTitle")}</Text>
          <TextInput
            style={styles.offerInput}
            value={offerEuro}
            onChangeText={setOfferEuro}
            keyboardType="decimal-pad"
            placeholder={t("listing.offerPh")}
            placeholderTextColor={Theme.muted}
          />
          <Pressable
            style={[styles.offerBtn, offerBusy && styles.offerBtnDisabled]}
            onPress={submitOffer}
            disabled={offerBusy}
          >
            <Text style={styles.offerBtnText}>{t("listing.offerSend")}</Text>
          </Pressable>
        </View>
      ) : null}

      {token && isSeller && offers.length > 0 ? (
        <View style={styles.offerBox}>
          <Text style={styles.offerTitle}>{t("listing.incomingOffers")}</Text>
          {offers.map((o) => (
            <View key={String(o.id)} style={styles.offerRow}>
              <Text style={styles.offerRowText}>
                {formatPrice(o.price_cents, o.currency)} · {o.status}
              </Text>
              {o.status === "PENDING" ? (
                <View style={styles.offerActions}>
                  <Pressable
                    onPress={() => onAcceptOffer(o.id)}
                    style={styles.offerAccept}
                  >
                    <Text style={styles.offerAcceptText}>
                      {t("listing.offerAccept")}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => onRejectOffer(o.id)}>
                    <Text style={styles.offerReject}>{t("listing.offerReject")}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          navigation.navigate("Profile", {
            screen: "ProfilePublicUser",
            params: { userId: listing.seller_id },
          })
        }
      >
        <Text style={styles.seller}>
          {t("listing.seller")}: {listing.seller_display_name || "—"}
        </Text>
      </Pressable>

      <Text style={styles.label}>{t("listing.sport")}</Text>
      <Text style={styles.value}>{listing.sport}</Text>
      <Text style={styles.label}>{t("listing.manufacturer")}</Text>
      <Text style={styles.value}>{listing.manufacturer}</Text>
      <Text style={styles.label}>{t("listing.setName")}</Text>
      <Text style={styles.value}>{listing.set_name || "—"}</Text>
      <Text style={styles.label}>{t("listing.year")}</Text>
      <Text style={styles.value}>{String(listing.year)}</Text>
      <Text style={styles.label}>{t("listing.team")}</Text>
      <Text style={styles.value}>{listing.team || "—"}</Text>
      <Text style={styles.label}>{t("listing.cardNumber")}</Text>
      <Text style={styles.value}>{listing.card_number || "—"}</Text>
      <Text style={styles.label}>{t("listing.cardType")}</Text>
      <Text style={styles.value}>{listing.card_type}</Text>
      <Text style={styles.label}>{t("listing.condition")}</Text>
      <Text style={styles.value}>{listing.condition_grade}</Text>
      <Text style={styles.label}>{t("listing.description")}</Text>
      <Text style={styles.value}>{listing.description || "—"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  content: { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.bg,
  },
  imageStrip: {
    marginBottom: 16,
    maxHeight: IMG_H,
  },
  heroImage: {
    height: IMG_H,
    backgroundColor: Theme.card,
  },
  imagePlaceholder: {
    height: IMG_H,
    backgroundColor: Theme.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  player: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.text,
    letterSpacing: -0.3,
    paddingHorizontal: 20,
  },
  price: {
    fontSize: 22,
    color: Theme.text,
    marginTop: 10,
    fontWeight: "800",
    paddingHorizontal: 20,
  },
  marketLine: {
    fontSize: 15,
    color: Theme.sub,
    marginTop: 8,
    paddingHorizontal: 20,
    fontWeight: "600",
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  rangeChipOn: {
    backgroundColor: Theme.soft,
    borderColor: Theme.text,
  },
  rangeChipText: { fontSize: 13, color: Theme.muted, fontWeight: "600" },
  rangeChipTextOn: { fontSize: 13, color: Theme.text, fontWeight: "700" },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 56,
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 3,
  },
  chartBarWrap: { flex: 1, justifyContent: "flex-end" },
  chartBar: {
    backgroundColor: Theme.heroBg,
    borderRadius: 3,
    width: "100%",
    minHeight: 4,
  },
  chartEmpty: {
    fontSize: 13,
    color: Theme.muted,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  legalBox: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Theme.soft,
    fontSize: 12,
    color: Theme.sub,
    lineHeight: 18,
  },
  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  verifyBannerText: { flex: 1, fontSize: 13, color: Theme.error },
  metaCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  metaTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Theme.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metaText: { fontSize: 15, color: Theme.text, fontWeight: "600" },
  error: { color: Theme.error, marginTop: 12, paddingHorizontal: 20 },
  muted: { color: Theme.muted },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
    paddingHorizontal: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: Theme.heroBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryBtnText: { color: Theme.onWhite, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryBtnText: { color: Theme.text, fontWeight: "600" },
  outlineBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.sub,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  outlineBtnText: { color: Theme.sub, fontWeight: "600" },
  offerBox: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Theme.text,
    marginBottom: 10,
  },
  offerInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Theme.text,
    marginBottom: 10,
  },
  offerBtn: {
    backgroundColor: Theme.heroBg,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  offerBtnDisabled: { opacity: 0.7 },
  offerBtnText: { color: Theme.onWhite, fontWeight: "700" },
  offerWithdrawBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 8,
  },
  offerWithdrawText: { color: Theme.error, fontWeight: "700", fontSize: 15 },
  offerRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  offerRowText: { fontSize: 15, fontWeight: "600", color: Theme.text },
  offerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  offerAccept: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Theme.soft,
  },
  offerAcceptText: { fontWeight: "700", color: Theme.text },
  offerReject: { color: Theme.error, fontWeight: "600" },
  seller: {
    marginTop: 18,
    marginBottom: 12,
    color: Theme.sub,
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  label: {
    marginTop: 14,
    fontSize: 12,
    color: Theme.muted,
    letterSpacing: 0.2,
    paddingHorizontal: 20,
  },
  value: {
    fontSize: 16,
    color: Theme.text,
    marginTop: 6,
    paddingHorizontal: 20,
  },
});
