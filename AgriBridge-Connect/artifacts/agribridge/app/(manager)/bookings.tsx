import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;
const M = C.managerBadge;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  approved: { bg: "#E8F5E9", text: "#1B5E20" },
  rejected: { bg: "#FFEBEE", text: "#B71C1C" },
  cancelled: { bg: "#ECEFF1", text: "#546E7A" },
};

interface Booking {
  id: number;
  storageId: number;
  storageName?: string;
  farmerName?: string;
  farmName?: string;
  productName: string;
  quantity: string;
  startDate: string;
  endDate: string;
  totalCost?: string;
  status: string;
  notes?: string;
}

export default function ManagerBookings() {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [storageIds, setStorageIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadData() {
    try {
      const [allBookings, storages] = await Promise.all([
        apiFetch("/storage/bookings"),
        apiFetch("/storage"),
      ]);
      const myStorages = storages.filter((s: any) => s.managerId === user?.id);
      const myIds = myStorages.map((s: any) => s.id);
      setStorageIds(myIds);
      const myBookings = allBookings.filter((b: any) => myIds.includes(b.storageId));
      setBookings(myBookings);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function updateBookingStatus(id: number, status: "approved" | "rejected") {
    try {
      await apiFetch(`/storage/bookings/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      showToast(status === "approved" ? "Booking approved" : "Booking rejected", status === "approved" ? "success" : "info");
      loadData();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    }
  }

  function confirmAction(id: number, status: "approved" | "rejected") {
    const label = status === "approved" ? "Approve" : "Reject";
    const msg = `${label} booking #${id}?`;
    if (Platform.OS === "web") {
      if (window.confirm(msg)) updateBookingStatus(id, status);
    } else {
      Alert.alert(`${label} Booking`, msg, [
        { text: "Cancel", style: "cancel" },
        { text: label, style: status === "rejected" ? "destructive" : "default", onPress: () => updateBookingStatus(id, status) },
      ]);
    }
  }

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Requests</Text>
        <Text style={styles.count}>{bookings.length} total</Text>
      </View>

      <View style={styles.filterRow}>
        {["all", "pending", "approved", "rejected"].map(f => (
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
        <ActivityIndicator color={M} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={M} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={52} color={C.border} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = STATUS_COLORS[item.status] ?? { bg: "#eee", text: "#333" };
            const days = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <View style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.bookingId}>#{item.id}</Text>
                </View>

                <View style={styles.farmerInfo}>
                  <View style={[styles.farmerAvatar, { backgroundColor: M }]}>
                    <Text style={styles.farmerAvatarText}>{(item.farmerName ?? "F")[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.farmerName}>{item.farmerName ?? "Farmer"}</Text>
                    {item.farmName && <Text style={styles.farmName}>{item.farmName}</Text>}
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <DetailItem icon="package" label="Product" value={item.productName} />
                  <DetailItem icon="layers" label="Quantity" value={`${item.quantity} kg`} />
                  <DetailItem icon="calendar" label="Duration" value={`${days} days`} />
                  {item.totalCost && (
                    <DetailItem icon="dollar-sign" label="Cost" value={`₹${parseFloat(item.totalCost).toLocaleString()}`} colored />
                  )}
                </View>

                <View style={styles.dateRow}>
                  <Feather name="calendar" size={13} color={C.textMuted} />
                  <Text style={styles.dateText}>
                    {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                </View>

                {item.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                )}

                {item.status === "pending" && (
                  <View style={styles.actionBtns}>
                    <Pressable
                      style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.85 : 1 }]}
                      onPress={() => confirmAction(item.id, "rejected")}
                    >
                      <Feather name="x" size={16} color="#F44336" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.85 : 1 }]}
                      onPress={() => confirmAction(item.id, "approved")}
                    >
                      <Feather name="check" size={16} color="#fff" />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </Pressable>
                  </View>
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

function DetailItem({ icon, label, value, colored }: { icon: string; label: string; value: string; colored?: boolean }) {
  return (
    <View style={diStyles.item}>
      <Feather name={icon as any} size={13} color={C.textMuted} />
      <View>
        <Text style={diStyles.label}>{label}</Text>
        <Text style={[diStyles.value, colored && { color: M }]}>{value}</Text>
      </View>
    </View>
  );
}

const diStyles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  label: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted, textTransform: "uppercase" },
  value: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
});

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
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 12, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: M, borderColor: M },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
  bookingCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bookingId: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  farmerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  farmerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  farmerAvatarText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  farmerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  farmName: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  notesBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: M,
  },
  notesText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, fontStyle: "italic" },
  actionBtns: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF8F8",
  },
  rejectBtnText: { color: "#F44336", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  approveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
