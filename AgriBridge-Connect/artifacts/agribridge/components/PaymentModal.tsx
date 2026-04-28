import React, { useState } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable,
  ScrollView, TextInput, ActivityIndicator, Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.light;

type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  title: string;
  description?: string;
  onClose: () => void;
  onSuccess: (method: PaymentMethod) => void;
}

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "Punjab National Bank"];

export function PaymentModal({ visible, amount, title, description, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  function resetState() {
    setMethod("upi");
    setUpiId("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardName("");
    setSelectedBank("");
    setProcessing(false);
    setSuccess(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function formatCardNumber(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function validate(): string | null {
    if (method === "upi") {
      if (!upiId.trim()) return "Please enter your UPI ID";
      if (!upiId.includes("@")) return "Enter a valid UPI ID (e.g. name@upi)";
    } else if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) return "Enter a valid 16-digit card number";
      if (cardExpiry.length < 5) return "Enter card expiry (MM/YY)";
      if (cardCvv.length < 3) return "Enter 3-digit CVV";
      if (!cardName.trim()) return "Enter name on card";
    } else if (method === "netbanking") {
      if (!selectedBank) return "Please select your bank";
    }
    return null;
  }

  async function handlePay() {
    const err = validate();
    if (err) {
      if (Platform.OS === "web") {
        window.alert(err);
      }
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setProcessing(false);
    setSuccess(true);
    setTimeout(() => {
      resetState();
      onSuccess(method);
    }, 1800);
  }

  const METHODS: { key: PaymentMethod; label: string; icon: string; iconSet?: "community" }[] = [
    { key: "upi", label: "UPI", icon: "smartphone" },
    { key: "card", label: "Card", icon: "credit-card" },
    { key: "netbanking", label: "Net Banking", icon: "globe" },
    { key: "cod", label: "Cash on Delivery", icon: "package" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
      <View style={styles.root}>
        {success ? (
          <View style={styles.successScreen}>
            <View style={styles.successCircle}>
              <Feather name="check" size={52} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successAmt}>₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</Text>
            <Text style={styles.successSub}>{title}</Text>
            <ActivityIndicator color={C.primary} style={{ marginTop: 28 }} />
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Pressable style={styles.closeBtn} onPress={handleClose}>
                <Feather name="x" size={22} color={C.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Payment</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amountValue}>₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</Text>
                <Text style={styles.amountSub}>{title}</Text>
                {description ? <Text style={styles.amountDesc}>{description}</Text> : null}
              </View>

              <Text style={styles.sectionTitle}>Choose Payment Method</Text>

              <View style={styles.methodsGrid}>
                {METHODS.map(m => (
                  <Pressable
                    key={m.key}
                    style={[styles.methodCard, method === m.key && styles.methodCardActive]}
                    onPress={() => setMethod(m.key)}
                  >
                    <Feather name={m.icon as any} size={22} color={method === m.key ? "#fff" : C.primary} />
                    <Text style={[styles.methodLabel, method === m.key && styles.methodLabelActive]}>{m.label}</Text>
                    {method === m.key && (
                      <View style={styles.methodCheck}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              {method === "upi" && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>UPI ID</Text>
                  <TextInput
                    style={styles.textInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@upi"
                    placeholderTextColor={C.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.upiApps}>
                    {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                      <View key={app} style={styles.upiAppChip}>
                        <Text style={styles.upiAppText}>{app}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {method === "card" && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cardNumber}
                    onChangeText={t => setCardNumber(formatCardNumber(t))}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={C.textMuted}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  <Text style={styles.inputLabel}>Name on Card</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="Full name as on card"
                    placeholderTextColor={C.textMuted}
                    autoCapitalize="words"
                  />
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Expiry</Text>
                      <TextInput
                        style={styles.textInput}
                        value={cardExpiry}
                        onChangeText={t => setCardExpiry(formatExpiry(t))}
                        placeholder="MM/YY"
                        placeholderTextColor={C.textMuted}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput
                        style={styles.textInput}
                        value={cardCvv}
                        onChangeText={t => setCardCvv(t.replace(/\D/g, "").slice(0, 3))}
                        placeholder="•••"
                        placeholderTextColor={C.textMuted}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={3}
                      />
                    </View>
                  </View>
                  <View style={styles.cardBrands}>
                    <MaterialCommunityIcons name="credit-card" size={24} color="#1A1F71" />
                    <MaterialCommunityIcons name="credit-card-outline" size={24} color="#EB001B" />
                  </View>
                </View>
              )}

              {method === "netbanking" && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Select Your Bank</Text>
                  <View style={styles.bankList}>
                    {BANKS.map(bank => (
                      <Pressable
                        key={bank}
                        style={[styles.bankRow, selectedBank === bank && styles.bankRowActive]}
                        onPress={() => setSelectedBank(bank)}
                      >
                        <View style={[styles.bankRadio, selectedBank === bank && styles.bankRadioActive]}>
                          {selectedBank === bank && <View style={styles.bankRadioDot} />}
                        </View>
                        <Text style={[styles.bankName, selectedBank === bank && styles.bankNameActive]}>{bank}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {method === "cod" && (
                <View style={styles.codCard}>
                  <Feather name="info" size={20} color={C.accent} />
                  <Text style={styles.codText}>
                    Pay ₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })} in cash when your order is delivered or when you access the storage facility.
                  </Text>
                </View>
              )}

              <View style={styles.secureRow}>
                <Feather name="lock" size={14} color={C.textMuted} />
                <Text style={styles.secureText}>100% Secure · End-to-end encrypted payment</Text>
              </View>
            </ScrollView>

            <View style={styles.payFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.payBtn,
                  processing && styles.payBtnProcessing,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={handlePay}
                disabled={processing}
              >
                {processing ? (
                  <View style={styles.processingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.payBtnText}>Processing…</Text>
                  </View>
                ) : (
                  <>
                    <Feather name="lock" size={18} color="#fff" />
                    <Text style={styles.payBtnText}>
                      Pay ₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  scroll: { padding: 20, paddingBottom: 40 },
  amountCard: {
    backgroundColor: C.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    gap: 4,
  },
  amountLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 },
  amountValue: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  amountSub: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.85)", marginTop: 4 },
  amountDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2, textAlign: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  methodsGrid: { flexDirection: "row", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  methodCard: {
    flex: 1, minWidth: "22%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.border,
    position: "relative",
  },
  methodCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  methodLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textAlign: "center" },
  methodLabelActive: { color: "#fff" },
  methodCheck: {
    position: "absolute", top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  inputSection: { gap: 12, marginBottom: 20 },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: -4 },
  textInput: {
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
  cardRow: { flexDirection: "row", gap: 12 },
  cardBrands: { flexDirection: "row", gap: 8, marginTop: 4 },
  upiApps: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  upiAppChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.paleGreen,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  upiAppText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  bankList: { gap: 8 },
  bankRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12,
    padding: 14, borderWidth: 1.5, borderColor: C.border,
  },
  bankRowActive: { borderColor: C.primary, backgroundColor: "#F0FFF4" },
  bankRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  bankRadioActive: { borderColor: C.primary },
  bankRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  bankName: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  bankNameActive: { fontFamily: "Inter_600SemiBold", color: C.primary },
  codCard: {
    flexDirection: "row", gap: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#FFE082",
    marginBottom: 20, alignItems: "flex-start",
  },
  codText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#5D4037", lineHeight: 22 },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 8 },
  secureText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  payFooter: {
    padding: 16, paddingBottom: Platform.OS === "web" ? 20 : 30,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.background,
  },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: C.primary, borderRadius: 16,
    height: 58,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  payBtnProcessing: { backgroundColor: "#4CAF50" },
  processingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  payBtnText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  successScreen: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: 12, padding: 40,
  },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#4CAF50",
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#4CAF50", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  successAmt: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#4CAF50" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
});
