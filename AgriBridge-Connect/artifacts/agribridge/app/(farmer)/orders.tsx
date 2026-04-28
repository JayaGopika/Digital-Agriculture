import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  packed: { bg: "#E3F2FD", text: "#1565C0" },
  shipped: { bg: "#F3E5F5", text: "#6A1B9A" },
  delivered: { bg: "#E8F5E9", text: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", text: "#B71C1C" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "packed",
  packed: "shipped",
  shipped: "delivered",
};

interface Order {
  id: number;
  customerName?: string;
  productName?: string;
  productCategory?: string;
  quantity: string;
  totalAmount: string;
  status: string;
  deliveryAddress?: string;
  createdAt: string;
}

export default function FarmerOrders() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadOrders() {
    try {
      const data = await apiFetch("/orders");
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(orderId: number, status: string) {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      showToast(`Order #${orderId} marked as ${label}`, "success");
    } catch (e: unknown) {
      if (Platform.OS === "web") {
        window.alert("Failed to update order: " + (e as Error).message);
      } else {
        Alert.alert("Error", (e as Error).message);
      }
    }
  }

  function confirmStatusUpdate(orderId: number, nextStatus: string) {
    const label = nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1);
    if (Platform.OS === "web") {
      if (window.confirm(`Mark order #${orderId} as ${label}?`)) {
        updateStatus(orderId, nextStatus);
      }
      return;
    }
    Alert.alert(`Mark as ${label}?`, `Update order #${orderId} to ${label}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => updateStatus(orderId, nextStatus) },
    ]);
  }

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.count}>{orders.length} total</Text>
      </View>

      <View style={styles.filterRow}>
        {["all", "pending", "packed", "shipped", "delivered"].map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={C.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={48} color={C.border} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_COLORS[item.status] ?? { bg: "#eee", text: "#333" };
            const nextStatus = NEXT_STATUS[item.status];
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.productName}>{item.productName ?? "Product"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Feather name="user" size={14} color={C.textMuted} />
                    <Text style={styles.detailText}>{item.customerName ?? "Customer"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="package" size={14} color={C.textMuted} />
                    <Text style={styles.detailText}>{item.quantity} units</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="dollar-sign" size={14} color={C.textMuted} />
                    <Text style={[styles.detailText, { color: C.primary, fontFamily: "Inter_700Bold" }]}>
                      ₹{parseFloat(item.totalAmount).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {item.deliveryAddress && (
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={14} color={C.textMuted} />
                    <Text style={[styles.detailText, { flex: 1 }]} numberOfLines={1}>{item.deliveryAddress}</Text>
                  </View>
                )}

                {nextStatus && (
                  <Pressable
                    style={({ pressed }) => [styles.updateBtn, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => confirmStatusUpdate(item.id, nextStatus)}
                  >
                    <Text style={styles.updateBtnText}>
                      Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </Text>
                    <Feather name="arrow-right" size={16} color="#fff" />
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      )}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  count: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
  orderCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  productName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  orderDetails: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  updateBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
