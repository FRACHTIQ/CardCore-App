import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { CARD_TYPES } from "../config";
import { Theme } from "../theme";
import { api, analyzeCardImages } from "../api";
import { useAuth } from "../AuthContext";

export default function CreateListingScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [meProfile, setMeProfile] = useState(null);
  const [isPrivateMarket, setIsPrivateMarket] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!token) {
          setMeProfile(null);
          setIsPrivateMarket(false);
          return;
        }
        try {
          const data = await api("/api/users/me", { token });
          if (!cancelled && data?.user) {
            setMeProfile(data.user);
            if (!data.user.private_market_access) {
              setIsPrivateMarket(false);
            }
          }
        } catch {
          if (!cancelled) {
            setMeProfile(null);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token])
  );

  const privateMarketAccess = Boolean(meProfile?.private_market_access);
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
  const [isGraded, setIsGraded] = useState(false);
  const [gradingCompany, setGradingCompany] = useState("");
  const [gradingGrade, setGradingGrade] = useState("");
  const [shippingIncluded, setShippingIncluded] = useState(false);
  const [shippingEuro, setShippingEuro] = useState("");
  const [marketValueEuro, setMarketValueEuro] = useState("");
  const [marketValueSource, setMarketValueSource] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrlsRaw, setImageUrlsRaw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);

  useEffect(() => {
    const p = route?.params || {};
    if (p.scannedFront?.base64 && p.scannedFront?.uri) {
      setFront(p.scannedFront);
    }
    if (p.scannedBack?.base64 && p.scannedBack?.uri) {
      setBack(p.scannedBack);
    }
  }, [route?.params]);

  async function captureSide(side) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("", t("createListing.cameraDenied"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.72,
      allowsEditing: false,
      base64: true,
    });
    if (result.canceled || !result.assets || !result.assets[0]) {
      return;
    }
    const a = result.assets[0];
    const uri = a.uri;
    const mime = a.mimeType || "image/jpeg";
    const b64 = a.base64;
    if (!b64) {
      setError(t("createListing.noBase64"));
      return;
    }
    const payload = { uri, base64: b64, mime };
    if (side === "front") {
      setFront(payload);
    } else {
      setBack(payload);
    }
  }

  async function runAnalyze() {
    setError("");
    if (!token) {
      Alert.alert("", t("createListing.needLogin"));
      return;
    }
    if (!front?.base64 || !back?.base64) {
      Alert.alert("", t("createListing.needBothPhotos"));
      return;
    }
    setAnalyzeBusy(true);
    try {
      const data = await analyzeCardImages({
        token,
        frontBase64: front.base64,
        backBase64: back.base64,
        frontMime: front.mime || "image/jpeg",
        backMime: back.mime || "image/jpeg",
      });
      setSport(data.sport || "");
      setManufacturer(data.manufacturer || "");
      setSetName(data.set_name || "");
      setYear(String(data.year != null ? data.year : new Date().getFullYear()));
      setPlayerName(data.player_name || "");
      setTeam(data.team || "");
      setCardNumber(data.card_number || "");
      setConditionGrade(data.condition_grade || "");
      setDescription(data.description || "");
      if (data.card_type && CARD_TYPES.includes(data.card_type)) {
        setCardType(data.card_type);
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setAnalyzeBusy(false);
    }
  }

  async function onSave() {
    setError("");
    const y = Number(year);
    const pe = String(priceEuro).replace(",", ".").trim();
    const euros = Number(pe);
    if (!Number.isInteger(y) || y < 1800 || y > 2100) {
      setError(t("createListing.yearInvalid"));
      return;
    }
    if (!Number.isFinite(euros) || euros < 0) {
      setError(t("createListing.priceInvalid"));
      return;
    }
    const priceCents = Math.round(euros * 100);

    let shippingCostCents = null;
    if (!shippingIncluded) {
      const se = String(shippingEuro).replace(",", ".").trim();
      if (se !== "") {
        const shipEur = Number(se);
        if (!Number.isFinite(shipEur) || shipEur < 0) {
          setError(t("createListing.shippingInvalid"));
          return;
        }
        shippingCostCents = Math.round(shipEur * 100);
      }
    }

    let marketValueCents = null;
    const mve = String(marketValueEuro).replace(",", ".").trim();
    if (mve !== "") {
      const mvEur = Number(mve);
      if (!Number.isFinite(mvEur) || mvEur < 0) {
        setError(t("createListing.marketInvalid"));
        return;
      }
      marketValueCents = Math.round(mvEur * 100);
    }

    const imageUrls = imageUrlsRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const body = {
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
        is_graded: isGraded,
        grading_company: gradingCompany,
        grading_grade: gradingGrade,
        shipping_included: shippingIncluded,
        shipping_cost_cents: shippingCostCents,
        market_value_cents: marketValueCents,
        market_value_source: String(marketValueSource || "").trim(),
      };
      if (privateMarketAccess) {
        body.is_private_market = Boolean(isPrivateMarket);
      }
      await api("/api/listings", {
        token,
        method: "POST",
        body,
      });
      if (route?.params?.afterCreate === "MyListings") {
        navigation.navigate("MyListings");
      } else {
        navigation.navigate("HomeMain");
      }
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <StatusBar style="dark" />
      <Text style={styles.hint}>{t("createListing.structuredHint")}</Text>

      <Text style={styles.sectionTitle}>{t("createListing.scanTitle")}</Text>
      <Text style={styles.sectionSub}>{t("createListing.scanSub")}</Text>

      <View style={styles.photoRow}>
        <View style={styles.photoCol}>
          <Text style={styles.photoLabel}>{t("createListing.front")}</Text>
          <Pressable style={styles.photoBox} onPress={() => captureSide("front")}>
            {front ? (
              <Image source={{ uri: front.uri }} style={styles.photoImg} />
            ) : (
              <Text style={styles.photoPlaceholder}>＋</Text>
            )}
          </Pressable>
          {front ? (
            <Pressable onPress={() => captureSide("front")}>
              <Text style={styles.retake}>{t("createListing.retake")}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.photoCol}>
          <Text style={styles.photoLabel}>{t("createListing.back")}</Text>
          <Pressable style={styles.photoBox} onPress={() => captureSide("back")}>
            {back ? (
              <Image source={{ uri: back.uri }} style={styles.photoImg} />
            ) : (
              <Text style={styles.photoPlaceholder}>＋</Text>
            )}
          </Pressable>
          {back ? (
            <Pressable onPress={() => captureSide("back")}>
              <Text style={styles.retake}>{t("createListing.retake")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Pressable
        style={[styles.analyzeBtn, analyzeBusy && styles.analyzeBtnDisabled]}
        onPress={runAnalyze}
        disabled={analyzeBusy}
      >
        {analyzeBusy ? (
          <ActivityIndicator color={Theme.onWhite} />
        ) : (
          <Text style={styles.analyzeBtnText}>{t("createListing.analyze")}</Text>
        )}
      </Pressable>
      {analyzeBusy ? (
        <Text style={styles.analyzeHint}>{t("createListing.analyzing")}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>{t("listing.sport")}</Text>
      <TextInput
        style={styles.input}
        value={sport}
        onChangeText={setSport}
        placeholder={t("createListing.phSport")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.manufacturer")}</Text>
      <TextInput
        style={styles.input}
        value={manufacturer}
        onChangeText={setManufacturer}
        placeholder={t("createListing.phManufacturer")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.setName")}</Text>
      <TextInput
        style={styles.input}
        value={setName}
        onChangeText={setSetName}
        placeholder={t("createListing.phSetName")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.year")}</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholder={t("createListing.phYear")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.playerName")}</Text>
      <TextInput
        style={styles.input}
        value={playerName}
        onChangeText={setPlayerName}
        placeholder={t("createListing.phPlayerName")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.team")}</Text>
      <TextInput
        style={styles.input}
        value={team}
        onChangeText={setTeam}
        placeholder={t("createListing.phTeam")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.cardNumber")}</Text>
      <TextInput
        style={styles.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholder={t("createListing.phCardNumber")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("listing.cardType")}</Text>
      <View style={styles.typeRow}>
        {CARD_TYPES.map((ty) => (
          <Pressable
            key={ty}
            style={cardType === ty ? styles.typeChipActive : styles.typeChip}
            onPress={() => setCardType(ty)}
          >
            <Text
              style={
                cardType === ty ? styles.typeChipTextActive : styles.typeChipText
              }
            >
              {ty}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>{t("listing.condition")}</Text>
      <TextInput
        style={styles.input}
        value={conditionGrade}
        onChangeText={setConditionGrade}
        placeholder={t("createListing.phCondition")}
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("createListing.priceEur")}</Text>
      <TextInput
        style={styles.input}
        value={priceEuro}
        onChangeText={setPriceEuro}
        keyboardType="decimal-pad"
        placeholder={t("createListing.phPrice")}
        placeholderTextColor={Theme.muted}
      />

      <Text style={styles.sectionTitle}>{t("createListing.gradingSection")}</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("createListing.isGraded")}</Text>
        <Switch value={isGraded} onValueChange={setIsGraded} />
      </View>
      {isGraded ? (
        <>
          <Text style={styles.label}>{t("createListing.gradingCompany")}</Text>
          <TextInput
            style={styles.input}
            value={gradingCompany}
            onChangeText={setGradingCompany}
            placeholder={t("createListing.phGradingCompany")}
            placeholderTextColor={Theme.muted}
          />
          <Text style={styles.label}>{t("createListing.gradingGrade")}</Text>
          <TextInput
            style={styles.input}
            value={gradingGrade}
            onChangeText={setGradingGrade}
            placeholder={t("createListing.phGradingGrade")}
            placeholderTextColor={Theme.muted}
          />
        </>
      ) : null}

      <Text style={styles.sectionTitle}>{t("createListing.shippingSection")}</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t("createListing.shippingIncluded")}</Text>
        <Switch value={shippingIncluded} onValueChange={setShippingIncluded} />
      </View>
      <Text style={styles.label}>{t("createListing.shippingExtra")}</Text>
      <TextInput
        style={styles.input}
        value={shippingEuro}
        onChangeText={setShippingEuro}
        keyboardType="decimal-pad"
        placeholder={t("createListing.shippingExtraPh")}
        placeholderTextColor={Theme.muted}
      />

      <Text style={styles.sectionTitle}>{t("createListing.marketSection")}</Text>
      <Text style={styles.sectionSub}>{t("createListing.marketHint")}</Text>
      <Text style={styles.label}>{t("createListing.marketValueEur")}</Text>
      <TextInput
        style={styles.input}
        value={marketValueEuro}
        onChangeText={setMarketValueEuro}
        keyboardType="decimal-pad"
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("createListing.marketSource")}</Text>
      <TextInput
        style={styles.input}
        value={marketValueSource}
        onChangeText={setMarketValueSource}
        placeholder={t("createListing.phMarketSource")}
        placeholderTextColor={Theme.muted}
      />

      <Text style={styles.label}>{t("listing.description")}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholderTextColor={Theme.muted}
      />
      <Text style={styles.label}>{t("createListing.imageUrlsLabel")}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={imageUrlsRaw}
        onChangeText={setImageUrlsRaw}
        multiline
        placeholder={t("createListing.imageUrlsPh")}
        placeholderTextColor={Theme.muted}
      />

      {privateMarketAccess ? (
        <>
          <Text style={styles.sectionTitle}>{t("createListing.privateTradeTitle")}</Text>
          <Text style={styles.sectionSub}>{t("createListing.privateTradeSub")}</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t("createListing.privateTradeTitle")}</Text>
            <Switch
              value={isPrivateMarket}
              onValueChange={setIsPrivateMarket}
              trackColor={{ false: Theme.border, true: Theme.heroBg }}
            />
          </View>
        </>
      ) : null}

      {loading ? (
        <ActivityIndicator color={Theme.text} style={styles.spinner} />
      ) : null}
      {!loading ? (
        <Pressable style={styles.btn} onPress={onSave}>
          <Text style={styles.btnText}>{t("createListing.publish")}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  content: { padding: 20, paddingBottom: 48 },
  hint: { color: Theme.muted, marginBottom: 12, fontSize: 14 },
  sectionTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "700",
    color: Theme.text,
  },
  sectionSub: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: Theme.muted,
    lineHeight: 18,
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  photoCol: { width: "48%" },
  photoLabel: {
    fontSize: 12,
    color: Theme.muted,
    marginBottom: 6,
    letterSpacing: 0.15,
  },
  photoBox: {
    aspectRatio: 63 / 88,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    backgroundColor: Theme.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { width: "100%", height: "100%" },
  photoPlaceholder: { fontSize: 28, color: Theme.muted },
  retake: {
    marginTop: 6,
    fontSize: 12,
    color: Theme.sub,
    fontWeight: "600",
  },
  analyzeBtn: {
    backgroundColor: Theme.heroBg,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 6,
  },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeBtnText: { color: Theme.onWhite, fontSize: 15, fontWeight: "700" },
  analyzeHint: {
    fontSize: 12,
    color: Theme.muted,
    marginBottom: 16,
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 15, color: Theme.text, fontWeight: "600" },
  error: { color: Theme.error, marginBottom: 8, marginTop: 8 },
  label: {
    marginTop: 10,
    fontSize: 12,
    color: Theme.muted,
    letterSpacing: 0.15,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
    color: Theme.text,
    backgroundColor: Theme.surface,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  typeChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipActive: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.heroBg,
    backgroundColor: Theme.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  typeChipText: { color: Theme.muted, fontSize: 12, fontWeight: "600" },
  typeChipTextActive: {
    color: Theme.text,
    fontSize: 12,
    fontWeight: "700",
  },
  spinner: { marginVertical: 16 },
  btn: {
    backgroundColor: Theme.heroBg,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: Theme.onWhite, fontSize: 16, fontWeight: "700" },
});
