import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PRIMARY } from "../config";
import { api } from "../api";
import { useAuth } from "../AuthContext";

function formatPrice(cents, currency) {
  const c = Number(cents) || 0;
  const cur = currency || "EUR";
  return `${(c / 100).toFixed(2)} ${cur}`;
}

export default function ListingDetailScreen({ navigation, route }) {
  const { token } = useAuth();
  const id = route.params && route.params.id ? route.params.id : null;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favBusy, setFavBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

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
      setError(e.message || "Fehler");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

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
        if (listing) {
          setListing({ ...listing, is_favorited: false });
        }
      } else {
        await api(`/api/favorites/${listing.id}`, {
          token,
          method: "POST",
        });
        setIsFavorite(true);
        if (listing) {
          setListing({ ...listing, is_favorited: true });
        }
      }
    } catch (e) {
      setError(e.message || "Fehler");
    } finally {
      setFavBusy(false);
    }
  }

  async function startChat() {
    if (!token || !listing) {
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
      setError(e.message || "Fehler");
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  if (error && !listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Listing nicht gefunden.</Text>
      </View>
    );
  }

  const imgs = Array.isArray(listing.image_urls) ? listing.image_urls : [];

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.player}>{listing.player_name}</Text>
      <Text style={styles.price}>
        {formatPrice(listing.price_cents, listing.currency)}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        {token ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={toggleFavorite}
            disabled={favBusy}
          >
            <Text style={styles.secondaryBtnText}>
              {isFavorite ? "Aus Merkzettel" : "Merken"}
            </Text>
          </Pressable>
        ) : null}
        {token ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={startChat}
            disabled={chatBusy}
          >
            <Text style={styles.primaryBtnText}>Kontakt</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() =>
          navigation.navigate("Profile", {
            userId: listing.seller_id,
          })
        }
      >
        <Text style={styles.seller}>
          Verkäufer: {listing.seller_display_name || "—"}
        </Text>
      </Pressable>
      <Text style={styles.label}>Sport</Text>
      <Text style={styles.value}>{listing.sport}</Text>
      <Text style={styles.label}>Hersteller</Text>
      <Text style={styles.value}>{listing.manufacturer}</Text>
      <Text style={styles.label}>Set / Box</Text>
      <Text style={styles.value}>{listing.set_name || "—"}</Text>
      <Text style={styles.label}>Jahr</Text>
      <Text style={styles.value}>{String(listing.year)}</Text>
      <Text style={styles.label}>Team</Text>
      <Text style={styles.value}>{listing.team || "—"}</Text>
      <Text style={styles.label}>Kartennummer</Text>
      <Text style={styles.value}>{listing.card_number || "—"}</Text>
      <Text style={styles.label}>Kartentyp</Text>
      <Text style={styles.value}>{listing.card_type}</Text>
      <Text style={styles.label}>Zustand</Text>
      <Text style={styles.value}>{listing.condition_grade}</Text>
      <Text style={styles.label}>Beschreibung</Text>
      <Text style={styles.value}>{listing.description || "—"}</Text>
      <Text style={styles.label}>Bilder (URLs)</Text>
      {imgs.length ? (
        imgs.map((u, i) => (
          <Text key={String(i)} style={styles.urlLine}>
            {u}
          </Text>
        ))
      ) : (
        <Text style={styles.muted}>Keine Bild-URLs</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  player: { fontSize: 22, fontWeight: "700", color: "#111" },
  price: { fontSize: 20, color: PRIMARY, marginTop: 8, fontWeight: "600" },
  error: { color: "#a00", marginTop: 12 },
  muted: { color: "#888" },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 10 },
  primaryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: { color: PRIMARY, fontWeight: "600" },
  seller: {
    marginTop: 16,
    marginBottom: 12,
    color: PRIMARY,
    fontSize: 15,
    fontWeight: "600",
  },
  label: {
    marginTop: 12,
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { fontSize: 16, color: "#222", marginTop: 4 },
  urlLine: { fontSize: 13, color: "#444", marginTop: 4 },
});
