import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ActivityIndicator, RefreshControl, Modal,
  TextInput, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { PaymentModal } from "@/components/PaymentModal";
import Colors from "@/constants/colors";

const C = Colors.light;

interface StorageCenter {
  id: number;
  name: string;
  location: string;
  totalCapacity: string;
  availableCapacity: string;
  pricePerKgPerDay: string;
  temperature?: string;
  phone?: string;
  description?: string;
  managerName?: string;
  available: boolean;
}

interface Booking {
  id: number;
  storageName?: string;
  storageLocation?: string;
  productName: string;
  quantity: string;
  startDate: string;
  endDate: string;
  totalCost?: string;
  status: string;
  paymentStatus?: string;
  pricePerKgPerDay?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  approved: { bg: "#E8F5E9", text: "#1B5E20" },
  rejected: { bg: "#FFEBEE", text: "#B71C1C" },
  cancelled: { bg: "#ECEFF1", text: "#546E7A" },
  confirmed: { bg: "#E3F2FD", text: "#1565C0" },
};

export default function FarmerStorage() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [centers, setCenters] = useState<StorageCenter[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "mybookings">("browse");
  const [showBook, setShowBook] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<StorageCenter | null>(null);
  const [bookForm, setBookForm] = useState({
    productName: "", quantity: "",
    startDate: "", endDate: "", notes: "",
  });
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadData() {
    try {
      const [centersData, bookingsData] = await Promise.all([
        apiFetch("/storage"),
        apiFetch("/storage/bookings"),
      ]);
      setCenters(centersData);
      setBookings(bookingsData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleBook() {
    if (!bookForm.productName || !bookForm.quantity || !bookForm.startDate || !bookForm.endDate) {
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      await apiFetch("/storage/book", {
        method: "POST",
        body: JSON.stringify({
          storageId: selectedCenter!.id,
          productName: bookForm.productName,
          quantity: parseFloat(bookForm.quantity),
          startDate: bookForm.startDate,
          endDate: bookForm.endDate,
          notes: bookForm.notes,
        }),
      });
      setShowBook(false);
      setBookForm({ productName: "", quantity: "", startDate: "", endDate: "", notes: "" });
      showToast("Storage booking request sent", "success");
      setTab("mybookings");
      loadData();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    }
  }

  async function handleStoragePaymentSuccess(booking: Booking, method: string) {
    try {
      await apiFetch(`/storage/bookings/${booking.id}/pay`, {
        method: "PUT",
        body: JSON.stringify({ paymentMethod: method }),
      });
      setBookings(prev =>
        prev.map(b => b.id === booking.id ? { ...b, paymentStatus: "paid" } : b)
      );
      showToast("Payment confirmed! Storage access granted.", "success");
    } catch (e: unknown) {
      showToast("Payment recorded but failed to sync. Please refresh.", "error");
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cold Storage</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === "browse" && styles.tabActive]}
          onPress={() => setTab("browse")}
        >
          <Text style={[styles.tabText, tab === "browse" && styles.tabTextActive]}>Browse Centers</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "mybookings" && styles.tabActive]}
          onPress={() => setTab("mybookings")}
        >
          <Text style={[styles.tabText, tab === "mybookings" && styles.tabTextActive]}>My Bookings</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : tab === "browse" ? (
        <FlatList
          data={centers}
          keyExtractor={c => c.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="snowflake" size={48} color={C.border} />
              <Text style={styles.emptyText}>No storage centers available</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.storageCard}>
              <View style={styles.storageTop}>
                <View style={styles.storageIconBox}>
                  <MaterialCommunityIcons name="snowflake" size={24} color="#2196F3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storageName}>{item.name}</Text>
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={12} color={C.textMuted} />
                    <Text style={styles.storageLocation}>{item.location}</Text>
                  </View>
                  {item.managerName && (
                    <Text style={styles.managerName}>by {item.managerName}</Text>
                  )}
                </View>
                <View style={[styles.availBadge, { backgroundColor: item.available ? "#E8F5E9" : "#FFEBEE" }]}>
                  <Text style={{ color: item.available ? "#2E7D32" : "#C62828", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                    {item.available ? "Open" : "Full"}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{item.availableCapacity}T</Text>
                  <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{item.totalCapacity}T</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statVal, { color: C.primary }]}>₹{item.pricePerKgPerDay}</Text>
                  <Text style={styles.statLabel}>Per kg/day</Text>
                </View>
                {item.temperature && (
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: "#2196F3" }]}>{item.temperature}</Text>
                    <Text style={styles.statLabel}>Temp</Text>
                  </View>
                )}
              </View>

              {item.description && (
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              )}

              <Pressable
                style={({ pressed }) => [styles.bookBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => { setSelectedCenter(item); setShowBook(true); }}
                disabled={!item.available}
              >
                <MaterialCommunityIcons name="snowflake" size={16} color="#fff" />
                <Text style={styles.bookBtnText}>Book Storage</Text>
              </Pressable>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={b => b.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={48} color={C.border} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPaid = item.paymentStatus === "paid";
            const needsPayment = item.status === "approved" && !isPaid;
            const displayStatus = isPaid ? "confirmed" : item.status;
            const st = STATUS_COLORS[displayStatus] ?? { bg: "#eee", text: "#333" };
            return (
              <View style={[styles.bookingCard, needsPayment && styles.bookingCardAlert]}>
                <View style={styles.bookingTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingName}>{item.storageName ?? "Storage"}</Text>
                    <Text style={styles.bookingLocation}>{item.storageLocation}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {displayStatus === "confirmed" ? "Confirmed ✓" : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetailText}>
                    {item.productName} • {item.quantity} kg
                  </Text>
                  <Text style={styles.bookingDetailText}>
                    {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                  {item.totalCost && (
                    <Text style={[styles.bookingDetailText, { color: C.primary, fontFamily: "Inter_700Bold", fontSize: 15 }]}>
                      Total: ₹{parseFloat(item.totalCost).toLocaleString()}
                    </Text>
                  )}
                  {item.pricePerKgPerDay && (
                    <Text style={styles.bookingDetailText}>
                      ₹{item.pricePerKgPerDay}/kg/day
                    </Text>
                  )}
                </View>

                {needsPayment && (
                  <View style={styles.payNowBanner}>
                    <Feather name="alert-circle" size={16} color="#E65100" />
                    <Text style={styles.payNowBannerText}>
                      Your request was approved! Pay to confirm your storage slot.
                    </Text>
                  </View>
                )}

                {needsPayment && item.totalCost && (
                  <Pressable
                    style={({ pressed }) => [styles.payNowBtn, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => setPayingBooking(item)}
                  >
                    <Feather name="credit-card" size={16} color="#fff" />
                    <Text style={styles.payNowBtnText}>
                      Pay Now · ₹{parseFloat(item.totalCost).toLocaleString()}
                    </Text>
                  </Pressable>
                )}

                {isPaid && (
                  <View style={styles.paidBadge}>
                    <Feather name="check-circle" size={14} color="#2E7D32" />
                    <Text style={styles.paidBadgeText}>Storage Access Granted · Payment Complete</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={showBook} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={styles.modalCont} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book: {selectedCenter?.name}</Text>
            <Pressable onPress={() => setShowBook(false)}>
              <Feather name="x" size={24} color={C.text} />
            </Pressable>
          </View>

          <View style={styles.modalInfo}>
            <Text style={styles.modalInfoText}>₹{selectedCenter?.pricePerKgPerDay} per kg/day</Text>
            <Text style={styles.modalInfoText}>Available: {selectedCenter?.availableCapacity}T</Text>
          </View>

          {([
            { label: "Product Name *", key: "productName", placeholder: "e.g., Tomatoes" },
            { label: "Quantity (kg) *", key: "quantity", placeholder: "0", keyboardType: "numeric" },
            { label: "Start Date * (YYYY-MM-DD)", key: "startDate", placeholder: "2024-01-01" },
            { label: "End Date * (YYYY-MM-DD)", key: "endDate", placeholder: "2024-01-15" },
            { label: "Notes", key: "notes", placeholder: "Any special requirements..." },
          ] as any[]).map(field => (
            <View key={field.key} style={{ marginBottom: 14 }}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.formInput}
                value={bookForm[field.key as keyof typeof bookForm]}
                onChangeText={v => setBookForm(f => ({ ...f, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor={C.textMuted}
                keyboardType={field.keyboardType || "default"}
              />
            </View>
          ))}

          <Pressable style={({ pressed }) => [styles.bookBtnModal, { opacity: pressed ? 0.85 : 1 }]} onPress={handleBook}>
            <MaterialCommunityIcons name="snowflake" size={18} color="#fff" />
            <Text style={styles.bookBtnModalText}>Send Booking Request</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {payingBooking && (
        <PaymentModal
          visible={!!payingBooking}
          amount={parseFloat(payingBooking.totalCost ?? "0")}
          title={`Cold Storage: ${payingBooking.storageName ?? "Storage"}`}
          description={`${payingBooking.productName} · ${payingBooking.quantity} kg · ${new Date(payingBooking.startDate).toLocaleDateString()} → ${new Date(payingBooking.endDate).toLocaleDateString()}`}
          onClose={() => setPayingBooking(null)}
          onSuccess={(method) => {
            handleStoragePaymentSuccess(payingBooking, method);
            setPayingBooking(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  tabTextActive: { color: "#fff" },
  storageCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  storageTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  storageIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  storageName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  storageLocation: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  managerName: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statsRow: { flexDirection: "row", gap: 20 },
  stat: { alignItems: "center" },
  statVal: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingVertical: 10,
  },
  bookBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bookingCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bookingName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  bookingLocation: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bookingDetails: { gap: 4 },
  bookingDetailText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  bookingCardAlert: { borderColor: "#E65100", borderWidth: 1.5 },
  payNowBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FFF3E0", borderRadius: 10, padding: 10,
  },
  payNowBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#E65100", lineHeight: 18 },
  payNowBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#D4A017", borderRadius: 12, paddingVertical: 12,
  },
  payNowBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  paidBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E8F5E9", borderRadius: 10, padding: 10,
  },
  paidBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#2E7D32" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", color: C.textSecondary },
  modalCont: { flex: 1, backgroundColor: C.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 12,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, flex: 1, marginRight: 8 },
  modalInfo: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  modalInfoText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1565C0" },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  bookBtnModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2196F3",
    borderRadius: 14,
    height: 54,
    marginTop: 10,
  },
  bookBtnModalText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
