import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Alert, Platform, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";

const ADMIN = "#1A237E";

interface AdminProduct {
  id: number;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  available: boolean;
  createdAt: string;
  farmerName?: string;
  farmerLocation?: string;
}

export default function AdminProducts() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadProducts() {
    try {
      const data = await apiFetch("/admin/products");
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleDelete(id: number, name: string) {
    Alert.alert("Delete Product", `Remove "${name}" from the platform?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
            loadProducts();
          } catch (e: unknown) {
            Alert.alert("Error", (e as Error).message);
          }
        }
      }
    ]);
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.farmerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>All Products</Text>
        <Text style={styles.count}>{products.length} listed</Text>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={16} color="#7986CB" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or farmers..."
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} tintColor={ADMIN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color="#C5CAE9" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={[styles.categoryTag, { backgroundColor: item.available ? "#E8F5E9" : "#FFEBEE" }]}>
                <Text style={[styles.categoryText, { color: item.available ? "#2E7D32" : "#C62828" }]}>
                  {item.available ? "Active" : "Paused"}
                </Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{item.price}/{item.unit}</Text>
                  <Text style={styles.qty}>{item.quantity} {item.unit}</Text>
                </View>
                <View style={styles.farmerRow}>
                  <Feather name="user" size={11} color="#7986CB" />
                  <Text style={styles.farmerName}>{item.farmerName ?? "Unknown Farmer"}</Text>
                  {item.farmerLocation && (
                    <>
                      <Feather name="map-pin" size={11} color="#7986CB" />
                      <Text style={styles.farmerName}>{item.farmerLocation}</Text>
                    </>
                  )}
                </View>
                <Text style={styles.dateText}>
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Feather name="trash-2" size={16} color="#F44336" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: ADMIN },
  count: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#7986CB" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8EAF6",
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1A237E" },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8EAF6",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  categoryText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: ADMIN },
  category: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7986CB" },
  priceRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  price: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#2D6A4F" },
  qty: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9E9E9E" },
  farmerRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  farmerName: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7986CB" },
  dateText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#BDBDBD" },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#7986CB" },
});
