import { useCallback, useMemo, useState } from "react";

import {

  ActivityIndicator,

  Alert,

  Pressable,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  View,

} from "react-native";

import { StatusBar } from "expo-status-bar";

import { useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";

import { Theme } from "../theme";

import { api, getDeal, patchDeal } from "../api";

import { useAuth } from "../AuthContext";



function formatPrice(cents, currency) {

  const c = Number(cents) || 0;

  const cur = currency || "EUR";

  return `${(c / 100).toFixed(2)} ${cur}`;

}



export default function DealDetailScreen({ route, navigation }) {

  const { t } = useTranslation();

  const { token } = useAuth();

  const dealId = route.params?.dealId;

  const [deal, setDeal] = useState(null);

  const [meId, setMeId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [tracking, setTracking] = useState("");



  const load = useCallback(async () => {

    if (!token || !dealId) {

      setDeal(null);

      setLoading(false);

      return;

    }

    try {

      const [mine, data] = await Promise.all([

        api("/api/users/me", { token }),

        getDeal(token, dealId),

      ]);

      setMeId(mine?.user?.id ?? null);

      setDeal(data.deal);

      if (data.deal?.tracking_number) {

        setTracking(String(data.deal.tracking_number));

      }

    } catch {

      setDeal(null);

    } finally {

      setLoading(false);

    }

  }, [token, dealId]);



  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      load();

    }, [load])

  );



  const isBuyer = useMemo(

    () =>

      meId != null && deal && Number(deal.buyer_id) === Number(meId),

    [meId, deal]

  );

  const isSeller = useMemo(

    () =>

      meId != null && deal && Number(deal.seller_id) === Number(meId),

    [meId, deal]

  );



  async function doPatch(body) {

    if (!token || !dealId) return;

    setBusy(true);

    try {

      const data = await patchDeal(token, dealId, body);

      setDeal(data.deal);

      if (data.deal?.tracking_number) {

        setTracking(String(data.deal.tracking_number));

      }

    } catch (e) {

      Alert.alert(t("common.error"), e.message || "");

    } finally {

      setBusy(false);

    }

  }



  function onShipped() {

    const tr = String(tracking).trim();

    if (!tr) {

      Alert.alert("", t("deals.trackingRequired"));

      return;

    }

    doPatch({ status: "SHIPPED", tracking_number: tr });

  }



  function onDelivered() {

    doPatch({ status: "DELIVERED" });

  }



  function onComplete() {

    doPatch({ status: "COMPLETED" });

  }



  function onCancel() {

    Alert.alert(t("deals.cancelTitle"), t("deals.cancelBody"), [

      { text: t("common.cancel"), style: "cancel" },

      {

        text: t("deals.cancelConfirm"),

        style: "destructive",

        onPress: () => doPatch({ status: "CANCELLED" }),

      },

    ]);

  }



  if (!token) {

    return (

      <View style={styles.center}>

        <StatusBar style="dark" />

        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>

      </View>

    );

  }



  if (loading || !deal) {

    return (

      <View style={styles.center}>

        <StatusBar style="dark" />

        {loading ? (

          <ActivityIndicator color={Theme.text} />

        ) : (

          <Text style={styles.muted}>{t("deals.notFound")}</Text>

        )}

      </View>

    );

  }



  const status = String(deal.status || "");

  const player = deal.listing_player_name || "—";



  return (

    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>

      <StatusBar style="dark" />

      <Text style={styles.player}>{player}</Text>

      <Text style={styles.price}>

        {formatPrice(deal.agreed_price_cents, deal.currency)}

      </Text>

      <Text style={styles.statusLine}>

        {t("deals.statusLabel")}: {status}

      </Text>

      {deal.tracking_number ? (

        <Text style={styles.track}>

          {t("deals.tracking")}: {deal.tracking_number}

        </Text>

      ) : null}



      {isSeller && status === "AGREED" ? (

        <View style={styles.card}>

          <Text style={styles.cardTitle}>{t("deals.shipCardTitle")}</Text>

          <TextInput

            style={styles.input}

            value={tracking}

            onChangeText={setTracking}

            placeholder={t("deals.trackingPh")}

            placeholderTextColor={Theme.muted}

            autoCapitalize="characters"

          />

          <Pressable

            style={[styles.primaryBtn, busy && styles.btnDisabled]}

            onPress={onShipped}

            disabled={busy}

          >

            <Text style={styles.primaryBtnText}>{t("deals.markShipped")}</Text>

          </Pressable>

        </View>

      ) : null}



      {isBuyer && status === "SHIPPED" ? (

        <Pressable

          style={[styles.primaryBtn, busy && styles.btnDisabled]}

          onPress={onDelivered}

          disabled={busy}

        >

          <Text style={styles.primaryBtnText}>{t("deals.markDelivered")}</Text>

        </Pressable>

      ) : null}



      {status === "DELIVERED" ? (

        <Pressable

          style={[styles.primaryBtn, busy && styles.btnDisabled]}

          onPress={onComplete}

          disabled={busy}

        >

          <Text style={styles.primaryBtnText}>{t("deals.complete")}</Text>

        </Pressable>

      ) : null}



      {(status === "AGREED" || status === "SHIPPED") && (isBuyer || isSeller) ? (

        <Pressable style={styles.outlineBtn} onPress={onCancel} disabled={busy}>

          <Text style={styles.outlineBtnText}>{t("deals.cancelDeal")}</Text>

        </Pressable>

      ) : null}



      <Text style={styles.hint}>{t("deals.hint")}</Text>

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  wrap: { flex: 1, backgroundColor: Theme.bg },

  content: { padding: 20, paddingBottom: 40 },

  center: {

    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: Theme.bg,

    paddingHorizontal: 24,

  },

  muted: { color: Theme.muted, fontSize: 15 },

  player: {

    fontSize: 22,

    fontWeight: "800",

    color: Theme.text,

  },

  price: {

    marginTop: 8,

    fontSize: 18,

    fontWeight: "700",

    color: Theme.text,

  },

  statusLine: {

    marginTop: 14,

    fontSize: 14,

    fontWeight: "600",

    color: Theme.sub,

  },

  track: {

    marginTop: 8,

    fontSize: 14,

    color: Theme.text,

  },

  card: {

    marginTop: 20,

    padding: 16,

    borderRadius: 14,

    backgroundColor: Theme.surface,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: Theme.line,

  },

  cardTitle: {

    fontSize: 15,

    fontWeight: "700",

    color: Theme.text,

    marginBottom: 10,

  },

  input: {

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: Theme.border,

    borderRadius: 10,

    paddingHorizontal: 12,

    paddingVertical: 12,

    fontSize: 16,

    color: Theme.text,

    backgroundColor: Theme.white,

    marginBottom: 12,

  },

  primaryBtn: {

    marginTop: 12,

    backgroundColor: Theme.heroBg,

    paddingVertical: 14,

    borderRadius: 12,

    alignItems: "center",

  },

  btnDisabled: { opacity: 0.55 },

  primaryBtnText: {

    color: Theme.onWhite,

    fontWeight: "700",

    fontSize: 16,

  },

  outlineBtn: {

    marginTop: 16,

    paddingVertical: 12,

    alignItems: "center",

  },

  outlineBtnText: {

    color: Theme.error,

    fontWeight: "600",

    fontSize: 15,

  },

  hint: {

    marginTop: 24,

    fontSize: 12,

    color: Theme.muted,

    lineHeight: 18,

  },

});


