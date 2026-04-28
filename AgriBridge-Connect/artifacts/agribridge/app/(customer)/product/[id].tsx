import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, Platform, Linking, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;

interface Product {
  id: number;
  farmerId: number;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  farmerName?: string;
  farmName?: string;
  farmerPhone?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface Review {
  id: number;
  customerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { apiFetch } = useApi();
  const { addToCart, items } = useCart();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const [p, r] = await Promise.all([
          apiFetch(`/products/${id}`),
          apiFetch(`/reviews/${id}`),
        ]);
        setProduct(p);
        setReviews(r);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const cartItem = items.find(i => i.productId === Number(id));

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: qty,
      unit: product.unit,
      imageUrl: product.imageUrl,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
    });
    showToast(`${qty} ${product.unit} of ${product.name} added to cart`, "success");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 0;

  function handleCall(phone: string) {
    if (Platform.OS === "web") {
      Alert.alert("Farmer Contact", `Phone: ${phone}`);
      return;
    }
    const url = `tel:${phone}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Farmer Contact", `Phone: ${phone}`);
      }
    });
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: topPad, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: C.textSecondary }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + bottomPad + TAB_BAR_HEIGHT }}>
        <View style={styles.navHeader}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>{product.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Feather name="image" size={48} color={C.border} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topSection}>
            <View>
              <Text style={styles.category}>{product.category}</Text>
              <Text style={styles.name}>{product.name}</Text>
            </View>
            <View>
              <Text style={styles.price}>₹{product.price}</Text>
              <Text style={styles.priceUnit}>per {product.unit}</Text>
            </View>
          </View>

          {product.averageRating && product.averageRating > 0 ? (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Feather key={s} name="star" size={16} color={s <= Math.round(product.averageRating!) ? C.accent : C.border} />
              ))}
              <Text style={styles.ratingText}>{product.averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            {product.location && (
              <View style={styles.infoBadge}>
                <Feather name="map-pin" size={12} color={C.primary} />
                <Text style={styles.infoBadgeText}>{product.location}</Text>
              </View>
            )}
            <View style={styles.infoBadge}>
              <Feather name="package" size={12} color={C.primary} />
              <Text style={styles.infoBadgeText}>{product.quantity} {product.unit} available</Text>
            </View>
          </View>

          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={styles.farmerCard}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarText}>{(product.farmerName ?? "F")[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.farmerLabel}>Sold by</Text>
              <Text style={styles.farmerName}>{product.farmerName ?? "Farmer"}</Text>
              {product.farmName && <Text style={styles.farmName}>{product.farmName}</Text>}
            </View>
            {product.farmerPhone && (
              <Pressable
                style={({ pressed }) => [styles.phoneBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handleCall(product.farmerPhone!)}
              >
                <Feather name="phone" size={16} color={C.primary} />
              </Pressable>
            )}
          </View>

          {reviews.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {reviews.slice(0, 3).map(r => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewerName}>{r.customerName ?? "Customer"}</Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Feather key={s} name="star" size={12} color={s <= r.rating ? C.accent : C.border} />
                      ))}
                    </View>
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                  <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 12, bottom: TAB_BAR_HEIGHT }]}>
        <View style={styles.qtySelector}>
          <Pressable style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
            <Feather name="minus" size={18} color={C.primary} />
          </Pressable>
          <Text style={styles.qtyText}>{qty}</Text>
          <Pressable style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
            <Feather name="plus" size={18} color={C.primary} />
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addToCartBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleAddToCart}
        >
          <Feather name="shopping-cart" size={18} color="#fff" />
          <Text style={styles.addToCartText}>
            Add to Cart • ₹{(parseFloat(product.price) * qty).toFixed(0)}
          </Text>
        </Pressable>
      </View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  navTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  heroImage: { width: "100%", height: 260 },
  heroPlaceholder: {
    width: "100%",
    height: 260,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, gap: 16 },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  category: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textMuted, textTransform: "uppercase" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2, maxWidth: "75%" },
  price: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.primary, textAlign: "right" },
  priceUnit: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "right" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginLeft: 4 },
  reviewCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  infoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.paleGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.primary },
  descSection: { gap: 6 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 8 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 22 },
  farmerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  farmerAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  farmerLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  farmerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  farmName: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  phoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 4,
  },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 20 },
  reviewDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: "rgba(248,250,248,0.95)",
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.paleGreen,
  },
  qtyText: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
