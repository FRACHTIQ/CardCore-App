import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { getListingThumbnailUri } from "../utils/listingImages";

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function MyListingsScreen({ navigation }) {
  const { t } = useTranslation();
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
      const mine = await api("/api/users/me", { token });
      const uid = mine?.user?.id;
      if (!uid) {
        setItems([]);
        return;
      }
      const q = new URLSearchParams({
        seller_id: String(uid),
        limit: "100",
        sort: "updated_at_desc",
      });
      const data = await api(`/api/listings?${q.toString()}`, { token });
      setItems(data.listings || []);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const listHeader = (
    <Pressable
      style={({ pressed }) => [
        styles.createRow,
        pressed ? styles.createRowPressed : null,
      ]}
      onPress={() =>
        navigation.navigate("CreateListing", { afterCreate: "MyListings" })
      }
      android_ripple={{ color: "rgba(26,26,26,0.08)" }}
    >
      <Ionicons name="add-circle-outline" size={22} color={Theme.onWhite} />
      <Text style={styles.createRowText}>{t("profile.myListingsNewButton")}</Text>
    </Pressable>
  );

  function renderItem({ item }) {
    const thumb = getListingThumbnailUri(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed ? styles.rowPressed : null,
        ]}
        onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
        android_ripple={{ color: "rgba(26,26,26,0.08)" }}
      >
        <Image source={{ uri: thumb }} style={styles.thumb} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.player_name}
            <Text style={styles.rowYear}> · {item.year}</Text>
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.sport} · {item.manufacturer}
          </Text>
          <Text style={styles.rowPrice}>
            {formatPrice(item.price_cents, item.currency)}
          </Text>
        </View>
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

  if (loading && items.length === 0 && !error) {
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.text}
              colors={[Theme.text]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t("profile.myListingsEmpty")}</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Theme.heroBg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  createRowPressed: { opacity: 0.92 },
  createRowText: {
    fontSize: 16,
    fontWeight: "800",
    color: Theme.onWhite,
    letterSpacing: -0.2,
  },
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted },
  error: { padding: 16, color: Theme.error },
  listContent: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Theme.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  rowPressed: { opacity: 0.94 },
  thumb: {
    width: 72,
    height: 96,
    borderRadius: 12,
    backgroundColor: Theme.card,
  },
  rowBody: { flex: 1, minWidth: 0, marginLeft: 12, justifyContent: "center" },
  rowTitle: { fontSize: 16, fontWeight: "800", color: Theme.text },
  rowYear: { fontWeight: "600", color: Theme.muted },
  rowMeta: { fontSize: 14, color: Theme.muted, marginTop: 6 },
  rowPrice: {
    fontSize: 16,
    color: Theme.text,
    marginTop: 10,
    fontWeight: "800",
  },
  empty: { textAlign: "center", color: Theme.muted, marginTop: 32 },
});
