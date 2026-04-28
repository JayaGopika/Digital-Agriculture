import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";

const ADMIN = "#1A237E";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  packed: { bg: "#E3F2FD", text: "#1565C0" },
  shipped: { bg: "#F3E5F5", text: "#6A1B9A" },
  delivered: { bg: "#E8F5E9", text: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", text: "#B71C1C" },
};

interface AdminOrder {
  id: number;
  quantity: string;
  totalAmount: string;
  status: string;
  deliveryAddress?: string;
  createdAt: string;
  productName?: string;
  customerName?: string;
}

const ALL_STATUSES = ["pending", "packed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadOrders() {
    try {
      const data = await apiFetch("/admin/orders");
      setOrders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadOrders(); }, []);

  async function handleStatusUpdate(id: number, status: string) {
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      loadOrders();
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    }
  }

  const totalRevenue = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>All Orders</Text>
        <View style={styles.revenueTag}>
          <Feather name="trending-up" size={12} color="#1B5E20" />
          <Text style={styles.revenueText}>₹{totalRevenue.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {["all", ...ALL_STATUSES].map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={ADMIN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="shopping-bag" size={48} color="#C5CAE9" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = STATUS_COLORS[item.status] ?? { bg: "#eee", text: "#333" };
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.productName}>{item.productName ?? "Product"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <View style={styles.detailItem}>
                    <Feather name="user" size={13} color="#7986CB" />
                    <Text style={styles.detailText}>{item.customerName ?? "Customer"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Feather name="package" size={13} color="#7986CB" />
                    <Text style={styles.detailText}>{item.quantity} units</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Feather name="dollar-sign" size={13} color="#2E7D32" />
                    <Text style={[styles.detailText, { color: "#2E7D32", fontFamily: "Inter_700Bold" }]}>
                      ₹{parseFloat(item.totalAmount).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {item.deliveryAddress && (
                  <View style={styles.detailItem}>
                    <Feather name="map-pin" size={13} color="#7986CB" />
                    <Text style={styles.detailText} numberOfLines={1}>{item.deliveryAddress}</Text>
                  </View>
                )}

                <View style={styles.statusActions}>
                  <Text style={styles.updateLabel}>Update status:</Text>
                  <View style={styles.statusBtns}>
                    {ALL_STATUSES.filter(s => s !== item.status).map(s => (
                      <Pressable
                        key={s}
                        style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[s]?.bg ?? "#eee" }]}
                        onPress={() => Alert.alert(`Set to ${s}?`, `Update order #${item.id} to "${s}"?`, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Update", onPress: () => handleStatusUpdate(item.id, s) },
                        ])}
                      >
                        <Text style={[styles.statusBtnText, { color: STATUS_COLORS[s]?.text ?? "#333" }]}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            );
          }}
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
  revenueTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  revenueText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#1B5E20" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 12, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#E8EAF6",
    borderWidth: 1,
    borderColor: "#C5CAE9",
  },
  filterChipActive: { backgroundColor: ADMIN, borderColor: ADMIN },
  filterChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#5C6BC0" },
  filterChipTextActive: { color: "#fff" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7986CB" },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: ADMIN, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  details: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#616161" },
  statusActions: { borderTopWidth: 1, borderTopColor: "#E8EAF6", paddingTop: 10 },
  updateLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#7986CB", marginBottom: 6 },
  statusBtns: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  statusBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#7986CB" },
});
