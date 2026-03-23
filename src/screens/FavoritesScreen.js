import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Layout, Theme } from "../theme";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { getListingThumbnailUri } from "../utils/listingImages";

const POLL_MS = 25000;

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const listContentStyle = useMemo(
    () => ({
      paddingTop: 12,
      paddingLeft: Math.max(insets.left, Layout.screenGutter),
      paddingRight: Math.max(insets.right, Layout.screenGutter),
      paddingBottom: insets.bottom + Layout.tabBarScrollExtra,
    }),
    [insets.left, insets.right, insets.bottom],
  );

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
    const thumb = getListingThumbnailUri(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed ? styles.rowPressed : null,
        ]}
        onPress={() =>
          navigation.navigate("ListingDetail", { id: item.id })
        }
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

  if (loading) {
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.text}
              colors={[Theme.text]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t("favorites.empty")}</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: Theme.muted },
  error: { padding: Layout.screenGutter, color: Theme.error },
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
  rowPrice: { fontSize: 16, color: Theme.text, marginTop: 10, fontWeight: "800" },
  empty: { textAlign: "center", color: Theme.muted, marginTop: 32 },
});
