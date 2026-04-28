import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Image, TextInput, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "@/context/CartContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { PaymentModal } from "@/components/PaymentModal";
import Colors from "@/constants/colors";

const C = Colors.light;
const TAB_BAR_HEIGHT = 84;

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const checkoutBarBottom = Platform.OS === "web" ? TAB_BAR_HEIGHT : 0;

  function handleClearCart() {
    if (items.length === 0) return;
    if (Platform.OS === "web") {
      if (window.confirm("Remove all items from cart?")) clearCart();
    } else {
      const { Alert } = require("react-native");
      Alert.alert("Clear Cart", "Remove all items?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearCart },
      ]);
    }
  }

  function handleProceedToPayment() {
    if (items.length === 0) return;
    if (!deliveryAddress.trim()) {
      showToast("Please enter a delivery address", "error");
      return;
    }
    setShowPayment(true);
  }

  async function handlePlaceOrders() {
    setLoading(true);
    try {
      for (const item of items) {
        await apiFetch("/orders/place", {
          method: "POST",
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            deliveryAddress: deliveryAddress.trim(),
            notes: notes.trim() || undefined,
          }),
        });
      }
      clearCart();
      setDeliveryAddress("");
      setNotes("");
      showToast(`${items.length} order${items.length !== 1 ? "s" : ""} placed successfully!`, "success");
      setTimeout(() => router.push("/(customer)/orders"), 1200);
    } catch (e: unknown) {
      showToast((e as Error).message || "Failed to place order", "error");
    } finally {
      setLoading(false);
    }
  }

  const checkoutBarHeight = 80 + bottomPad;

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: topPad }]}>
        <MaterialCommunityIcons name="cart-outline" size={80} color={C.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Browse products and add them to your cart</Text>
        <Pressable style={styles.browseBtn} onPress={() => router.replace("/(customer)")}>
          <Feather name="shopping-bag" size={18} color="#fff" />
          <Text style={styles.browseBtnText}>Browse Products</Text>
        </Pressable>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cart</Text>
          <Text style={styles.subtitle}>{items.length} item{items.length !== 1 ? "s" : ""}</Text>
        </View>
        <Pressable style={styles.clearBtn} onPress={handleClearCart}>
          <Feather name="trash-2" size={15} color="#F44336" />
          <Text style={styles.clearBtnText}>Clear all</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.productId.toString()}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 12,
          paddingBottom: checkoutBarHeight + checkoutBarBottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{ gap: 14, marginTop: 20 }}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="map-pin" size={16} color={C.primary} />
                <Text style={styles.sectionLabel}>Delivery Address *</Text>
              </View>
              <TextInput
                style={styles.addressInput}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="Enter your delivery address..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={16} color={C.textMuted} />
                <Text style={styles.sectionLabel}>Order Notes (Optional)</Text>
              </View>
              <TextInput
                style={styles.addressInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests or instructions..."
                placeholderTextColor={C.textMuted}
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {items.map(item => (
                <View key={item.productId} style={styles.summaryRow}>
                  <Text style={styles.summaryItem} numberOfLines={1}>
                    {item.name} × {item.quantity}
                  </Text>
                  <Text style={styles.summaryPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total</Text>
                <Text style={[styles.summaryPrice, { color: C.primary, fontSize: 18 }]}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Feather name="package" size={24} color={C.border} />
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemFarmer}>{item.farmerName ?? "Farmer"}</Text>
              <Text style={styles.itemPrice}>₹{item.price}/{item.unit}</Text>
            </View>
            <View style={styles.itemControls}>
              <Pressable style={styles.ctrlBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                <Feather name="minus" size={14} color={C.primary} />
              </Pressable>
              <Text style={styles.ctrlQty}>{item.quantity}</Text>
              <Pressable style={styles.ctrlBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                <Feather name="plus" size={14} color={C.primary} />
              </Pressable>
            </View>
            <Pressable onPress={() => removeFromCart(item.productId)} style={styles.removeBtn}>
              <Feather name="trash-2" size={16} color="#F44336" />
            </Pressable>
          </View>
        )}
      />

      <View style={[styles.checkoutBar, { bottom: checkoutBarBottom, paddingBottom: bottomPad + 12 }]}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.checkoutBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleProceedToPayment}
        >
          <Feather name="credit-card" size={18} color="#fff" />
          <Text style={styles.checkoutBtnText}>Proceed to Pay</Text>
        </Pressable>
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      <PaymentModal
        visible={showPayment}
        amount={total}
        title={`${items.length} item${items.length !== 1 ? "s" : ""} · AgriBridge Order`}
        description={`Delivery to: ${deliveryAddress}`}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          handlePlaceOrders();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  emptyContainer: {
    flex: 1, backgroundColor: C.background,
    alignItems: "center", justifyContent: "center",
    gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  browseBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  browseBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5, padding: 8 },
  clearBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#F44336" },
  cartItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14,
    padding: 12, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  itemImagePlaceholder: {
    width: 60, height: 60, borderRadius: 10, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
  },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  itemFarmer: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  itemPrice: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.primary },
  itemControls: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.paleGreen, borderRadius: 10,
    overflow: "hidden", borderWidth: 1, borderColor: C.border,
  },
  ctrlBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  ctrlQty: { width: 28, textAlign: "center", fontSize: 14, fontFamily: "Inter_700Bold", color: C.text },
  removeBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: "#FFEBEE",
    alignItems: "center", justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: C.card, borderRadius: 14,
    padding: 14, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  addressInput: {
    backgroundColor: C.background, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
    minHeight: 48,
  },
  summaryCard: {
    backgroundColor: C.card, borderRadius: 14,
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: C.border,
  },
  summaryTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryItem: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  summaryPrice: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  summaryTotal: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  checkoutBar: {
    position: "absolute", left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: "rgba(248,250,248,0.97)",
    borderTopWidth: 1, borderTopColor: C.border,
  },
  totalLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  totalAmount: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  checkoutBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
