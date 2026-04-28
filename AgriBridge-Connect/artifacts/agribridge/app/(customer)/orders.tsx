import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Platform,
  Modal, TextInput, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;

const STATUS_STEPS = ["pending", "packed", "shipped", "delivered"];
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100", icon: "clock" },
  packed: { bg: "#E3F2FD", text: "#1565C0", icon: "package" },
  shipped: { bg: "#F3E5F5", text: "#6A1B9A", icon: "truck" },
  delivered: { bg: "#E8F5E9", text: "#1B5E20", icon: "check-circle" },
  cancelled: { bg: "#FFEBEE", text: "#B71C1C", icon: "x-circle" },
};

interface Order {
  id: number;
  productId?: number;
  productName?: string;
  productImage?: string;
  farmerName?: string;
  quantity: string;
  totalAmount: string;
  status: string;
  deliveryAddress?: string;
  createdAt: string;
}

export default function CustomerOrders() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<number>>(new Set());

  const [ratingModal, setRatingModal] = useState<{ order: Order } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadOrders() {
    try {
      const data = await apiFetch("/orders");
      setOrders(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadOrders(); }, []);

  function openRating(order: Order) {
    setRating(0);
    setComment("");
    setRatingModal({ order });
  }

  async function submitReview() {
    if (!ratingModal) return;
    if (rating === 0) {
      showToast("Please select a star rating", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: ratingModal.order.productId,
          orderId: ratingModal.order.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      setReviewedOrderIds(prev => new Set([...prev, ratingModal.order.id]));
      setRatingModal(null);
      showToast("Review submitted! Thank you.", "success");
    } catch (e: unknown) {
      showToast((e as Error).message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.count}>{orders.length} total</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadOrders(); }}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={52} color={C.border} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>Browse products and place your first order</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = STATUS_COLORS[item.status] ?? { bg: "#eee", text: "#333", icon: "help-circle" };
            const statusIdx = STATUS_STEPS.indexOf(item.status);
            const isDelivered = item.status === "delivered";
            const alreadyReviewed = reviewedOrderIds.has(item.id);

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.productName ?? "Product"}</Text>
                    <Text style={styles.farmerName}>From {item.farmerName ?? "Farmer"}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Feather name={st.icon as any} size={12} color={st.text} />
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {item.status !== "cancelled" && (
                  <View style={styles.progressTrack}>
                    {STATUS_STEPS.map((step, idx) => (
                      <React.Fragment key={step}>
                        <View style={[styles.progressDot, idx <= statusIdx && { backgroundColor: C.primary }]}>
                          {idx <= statusIdx && <Feather name="check" size={8} color="#fff" />}
                        </View>
                        {idx < STATUS_STEPS.length - 1 && (
                          <View style={[styles.progressLine, idx < statusIdx && { backgroundColor: C.primary }]} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}

                {item.status !== "cancelled" && (
                  <View style={styles.stepLabels}>
                    {STATUS_STEPS.map(step => (
                      <Text key={step} style={styles.stepLabel}>{step.charAt(0).toUpperCase() + step.slice(1)}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.orderDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Qty</Text>
                    <Text style={styles.detailValue}>{item.quantity}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, { color: C.primary }]}>
                      ₹{parseFloat(item.totalAmount).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                {item.deliveryAddress && (
                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={13} color={C.textMuted} />
                    <Text style={styles.addressText} numberOfLines={1}>{item.deliveryAddress}</Text>
                  </View>
                )}

                {isDelivered && !alreadyReviewed && (
                  <Pressable
                    style={({ pressed }) => [styles.rateBtn, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => openRating(item)}
                  >
                    <Feather name="star" size={15} color={C.accent} />
                    <Text style={styles.rateBtnText}>Rate this Product</Text>
                  </Pressable>
                )}

                {isDelivered && alreadyReviewed && (
                  <View style={styles.reviewedBadge}>
                    <Feather name="check-circle" size={14} color="#2E7D32" />
                    <Text style={styles.reviewedText}>Review submitted</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={ratingModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate Your Order</Text>
            <Pressable onPress={() => setRatingModal(null)}>
              <Feather name="x" size={24} color={C.text} />
            </Pressable>
          </View>

          {ratingModal && (
            <>
              <View style={styles.reviewProductCard}>
                <Feather name="package" size={22} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewProductName}>{ratingModal.order.productName ?? "Product"}</Text>
                  <Text style={styles.reviewProductFarmer}>From {ratingModal.order.farmerName ?? "Farmer"}</Text>
                </View>
              </View>

              <Text style={styles.ratingLabel}>Your Rating *</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                    <Feather
                      name="star"
                      size={40}
                      color={star <= rating ? C.accent : C.border}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.ratingHint}>
                {rating === 0 ? "Tap a star to rate" :
                  rating === 1 ? "Poor" : rating === 2 ? "Fair" :
                    rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent!"}
              </Text>

              <Text style={[styles.ratingLabel, { marginTop: 20 }]}>Comment (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience with this product..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Pressable
                style={({ pressed }) => [styles.submitBtn, { opacity: pressed || submitting ? 0.85 : 1 }]}
                onPress={submitReview}
                disabled={submitting}
              >
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Review"}</Text>
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={() => setRatingModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  orderCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  productName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  farmerName: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  progressTrack: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  progressDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  progressLine: { flex: 1, height: 3, backgroundColor: C.border, borderRadius: 2 },
  stepLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: -6 },
  stepLabel: { fontSize: 9, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", width: 20 },
  orderDetails: {
    flexDirection: "row", gap: 20,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12,
  },
  detailItem: { gap: 3 },
  detailLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textMuted, textTransform: "uppercase" },
  detailValue: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  rateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#FFF8E1",
    borderWidth: 1.5, borderColor: "#FFE082",
  },
  rateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#E65100" },
  reviewedBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 8, borderRadius: 10, backgroundColor: "#E8F5E9",
  },
  reviewedText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#2E7D32" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  modalContainer: { flex: 1, backgroundColor: C.background },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, paddingTop: 12,
  },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  reviewProductCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.paleGreen, borderRadius: 14,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
  },
  reviewProductName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  reviewProductFarmer: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  ratingLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  ratingHint: { textAlign: "center", fontSize: 14, fontFamily: "Inter_500Medium", color: C.textSecondary, marginBottom: 4 },
  commentInput: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
    minHeight: 110,
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14, height: 54, marginTop: 20,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelBtn: { alignItems: "center", marginTop: 12, paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.textSecondary },
});
