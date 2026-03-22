import { useCallback, useState } from "react";

import {

  ActivityIndicator,

  FlatList,

  Pressable,

  RefreshControl,

  StyleSheet,

  Text,

  View,

} from "react-native";

import { StatusBar } from "expo-status-bar";

import { useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";

import { Theme } from "../theme";

import { api, getDeals } from "../api";

import { useAuth } from "../AuthContext";



function formatPrice(cents, currency) {

  const c = Number(cents) || 0;

  const cur = currency || "EUR";

  return `${(c / 100).toFixed(2)} ${cur}`;

}



export default function DealsListScreen({ navigation }) {

  const { t } = useTranslation();

  const { token } = useAuth();

  const [deals, setDeals] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [meId, setMeId] = useState(null);



  const load = useCallback(async () => {

    if (!token) {

      setDeals([]);

      setLoading(false);

      return;

    }

    try {

      const [mine, data] = await Promise.all([

        api("/api/users/me", { token }),

        getDeals(token, { limit: 50 }),

      ]);

      setMeId(mine?.user?.id ?? null);

      setDeals(data.deals || []);

    } catch {

      setDeals([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [token]);



  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      load();

    }, [load])

  );



  function onRefresh() {

    setRefreshing(true);

    load();

  }



  function renderItem({ item }) {

    const isBuyer = meId != null && Number(item.buyer_id) === Number(meId);

    const roleLabel = isBuyer ? t("deals.roleBuyer") : t("deals.roleSeller");

    const title =

      item.listing_player_name || t("deals.cardFallback");

    return (

      <Pressable

        style={({ pressed }) => [

          styles.row,

          pressed ? styles.rowPressed : null,

        ]}

        onPress={() =>

          navigation.navigate("DealDetail", { dealId: item.id })

        }

      >

        <Text style={styles.rowTitle} numberOfLines={1}>

          {title}

        </Text>

        <Text style={styles.rowMeta}>

          {formatPrice(item.agreed_price_cents, item.currency)} ·{" "}

          {roleLabel}

        </Text>

        <Text style={styles.rowStatus}>{item.status}</Text>

      </Pressable>

    );

  }



  if (!token) {

    return (

      <View style={styles.center}>

        <StatusBar style="dark" />

        <Text style={styles.muted}>{t("profile.pleaseSignIn")}</Text>

      </View>

    );

  }



  if (loading && deals.length === 0) {

    return (

      <View style={styles.center}>

        <StatusBar style="dark" />

        <ActivityIndicator color={Theme.text} />

      </View>

    );

  }



  return (

    <View style={styles.wrap}>

      <StatusBar style="dark" />

      <FlatList

        data={deals}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderItem}

        refreshControl={

          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />

        }

        contentContainerStyle={

          deals.length === 0 ? styles.emptyList : styles.listContent

        }

        ListEmptyComponent={

          <Text style={styles.empty}>{t("deals.empty")}</Text>

        }

      />

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { flex: 1, backgroundColor: Theme.bg },

  center: {

    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: Theme.bg,

    paddingHorizontal: 24,

  },

  muted: { color: Theme.muted, fontSize: 15 },

  listContent: { paddingBottom: 32 },

  emptyList: { flexGrow: 1, justifyContent: "center", padding: 24 },

  empty: {

    textAlign: "center",

    color: Theme.muted,

    fontSize: 15,

    lineHeight: 22,

  },

  row: {

    marginHorizontal: 16,

    marginTop: 10,

    padding: 16,

    borderRadius: 14,

    backgroundColor: Theme.surface,

    borderWidth: StyleSheet.hairlineWidth,

    borderColor: Theme.line,

  },

  rowPressed: { opacity: 0.92 },

  rowTitle: {

    fontSize: 17,

    fontWeight: "700",

    color: Theme.text,

  },

  rowMeta: {

    marginTop: 6,

    fontSize: 14,

    color: Theme.sub,

  },

  rowStatus: {

    marginTop: 8,

    fontSize: 12,

    fontWeight: "700",

    color: Theme.accentGreen,

    letterSpacing: 0.15,

  },

});


