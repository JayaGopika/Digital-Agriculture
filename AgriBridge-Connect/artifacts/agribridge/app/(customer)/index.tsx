import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Image, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.light;
const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Poultry", "Spices", "Other"];

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
  available: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export default function CustomerBrowse() {
  const { apiFetch } = useApi();
  const { addToCart, itemCount } = useCart();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadProducts() {
    try {
      let url = "/products";
      if (category !== "All") url += `?category=${encodeURIComponent(category)}`;
      const data = await apiFetch(url);
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadProducts(); }, [category]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.farmerName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleAddToCart(p: Product) {
    addToCart({
      productId: p.id,
      name: p.name,
      price: parseFloat(p.price),
      quantity: 1,
      unit: p.unit,
      imageUrl: p.imageUrl,
      farmerId: p.farmerId,
      farmerName: p.farmerName,
    });
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] ?? "there"}</Text>
          <Text style={styles.subtitle}>Fresh from the farm</Text>
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push("/(customer)/cart")}>
          <Feather name="shopping-cart" size={22} color={C.primary} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, farmers..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={18} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.catChip, category === item && styles.catChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catChipText, category === item && styles.catChipTextActive]}>{item}</Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="sprout-outline" size={52} color={C.border} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.productCard}
              onPress={() => router.push({ pathname: "/(customer)/product/[id]", params: { id: item.id.toString() } })}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <MaterialCommunityIcons name="food-apple-outline" size={36} color={C.border} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.farmerName} numberOfLines={1}>{item.farmerName ?? "Farmer"}</Text>
                {item.averageRating && item.averageRating > 0 ? (
                  <View style={styles.ratingRow}>
                    <Feather name="star" size={11} color={C.accent} />
                    <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>({item.reviewCount})</Text>
                  </View>
                ) : null}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{item.price}/{item.unit}</Text>
                  <Pressable
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Feather name="plus" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  subtitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginTop: 2 },
  cartBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: C.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  categoryList: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  catChipTextActive: { color: "#fff" },
  productCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: { width: "100%", height: 130 },
  productImagePlaceholder: {
    width: "100%",
    height: 130,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { padding: 12, gap: 3 },
  productCategory: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textMuted, textTransform: "uppercase" },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, lineHeight: 20 },
  farmerName: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.text },
  reviewCount: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  price: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.primary },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
