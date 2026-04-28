import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Modal, Image, Alert, ActivityIndicator, FlatList, Platform, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;
const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Dairy", "Poultry", "Spices", "Other"];

interface Product {
  id: number;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  description?: string;
  imageUrl?: string;
  available: boolean;
  location?: string;
}

function startWebSpeechRecognition(onResult: (text: string) => void, onStart: () => void, onEnd: () => void) {
  if (Platform.OS !== "web") return false;
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return false;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = onStart;
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };
  recognition.onend = onEnd;
  recognition.onerror = onEnd;
  recognition.start();
  return true;
}

function parseVoiceCommand(text: string): { name?: string; quantity?: string; price?: string; unit?: string } {
  const lower = text.toLowerCase();
  const result: { name?: string; quantity?: string; price?: string; unit?: string } = {};

  const UNITS = ["kilogram", "kilograms", "kilo", "kilos", "kg", "gram", "grams", "g",
    "quintal", "quintals", "dozen", "dozens", "liter", "liters", "litre", "litres", "l", "piece", "pieces"];
  const UNIT_MAP: Record<string, string> = {
    kilogram: "kg", kilograms: "kg", kilo: "kg", kilos: "kg", kg: "kg",
    gram: "g", grams: "g", g: "g",
    quintal: "quintal", quintals: "quintal",
    dozen: "dozen", dozens: "dozen",
    liter: "liter", liters: "liter", litre: "liter", litres: "liter", l: "liter",
    piece: "piece", pieces: "piece",
  };

  const unitPattern = UNITS.map(u => u.replace(/s$/, "s?")).join("|");
  const qtyRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitPattern})\\b`, "i");
  const qtyMatch = lower.match(qtyRegex);
  if (qtyMatch) {
    result.quantity = qtyMatch[1];
    result.unit = UNIT_MAP[qtyMatch[2].toLowerCase()] ?? "kg";
  }

  const priceRegex = /(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|inr)|(?:price|cost|rate|at|for)\s+(?:is\s+)?(\d+(?:\.\d+)?)/i;
  const priceMatch = lower.match(priceRegex);
  if (priceMatch) result.price = priceMatch[1] ?? priceMatch[2];

  let nameText = lower
    .replace(qtyRegex, " ")
    .replace(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|inr)/gi, " ")
    .replace(/\b(?:add|my|the|a|an|with|at|for|price|is|rate|cost|and|per|each)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (nameText) result.name = nameText.charAt(0).toUpperCase() + nameText.slice(1);
  return result;
}

export default function FarmerProducts() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<"name" | "description" | "all">("all");
  const [recognizedText, setRecognizedText] = useState("");
  const micPulse = useRef(new Animated.Value(1)).current;

  const [form, setForm] = useState({
    name: "", price: "", quantity: "", unit: "kg",
    category: "Vegetables", description: "", imageUrl: "", location: "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.stopAnimation();
      Animated.timing(micPulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isListening]);

  async function loadProducts() {
    try {
      const data = await apiFetch("/products/my");
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(); }, []);

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name, price: p.price, quantity: p.quantity, unit: p.unit,
      category: p.category, description: p.description ?? "", imageUrl: p.imageUrl ?? "", location: p.location ?? "",
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: "", price: "", quantity: "", unit: "kg", category: "Vegetables", description: "", imageUrl: "", location: "" });
    setEditProduct(null);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.quantity) {
      showToast("Name, price and quantity are required", "error");
      return;
    }
    try {
      if (editProduct) {
        await apiFetch(`/products/${editProduct.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...form, price: parseFloat(form.price), quantity: parseFloat(form.quantity) }),
        });
        showToast("Product updated successfully", "success");
      } else {
        await apiFetch("/products/add", {
          method: "POST",
          body: JSON.stringify({ ...form, price: parseFloat(form.price), quantity: parseFloat(form.quantity) }),
        });
        showToast("Product added successfully", "success");
      }
      setShowAdd(false);
      resetForm();
      loadProducts();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    }
  }

  async function handleDelete(id: number) {
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/products/${id}`, { method: "DELETE" });
            showToast("Product removed", "info");
            loadProducts();
          } catch (e: unknown) {
            showToast((e as Error).message, "error");
          }
        }
      }
    ]);
  }

  function handleVoiceInput(target: "name" | "description" | "all") {
    setVoiceTarget(target);
    setRecognizedText("");
    const started = startWebSpeechRecognition(
      (text) => {
        setRecognizedText(text);
        if (target === "all") {
          const parsed = parseVoiceCommand(text);
          setForm(f => ({
            ...f,
            ...(parsed.name ? { name: parsed.name } : {}),
            ...(parsed.quantity ? { quantity: parsed.quantity } : {}),
            ...(parsed.price ? { price: parsed.price } : {}),
            ...(parsed.unit ? { unit: parsed.unit } : {}),
          }));
          const filled = [parsed.name && "name", parsed.quantity && "qty", parsed.price && "price"].filter(Boolean);
          showToast(filled.length > 0 ? `Filled: ${filled.join(", ")}` : "Couldn't parse — try again", filled.length > 0 ? "success" : "warning");
        } else {
          setForm(f => ({ ...f, [target]: text }));
          showToast(`Voice captured`, "success");
        }
        setIsListening(false);
      },
      () => setIsListening(true),
      () => setIsListening(false),
    );
    if (!started) {
      Alert.alert("Voice Not Available", "Speech recognition works in Chrome on desktop. Use the text fields directly.", [{ text: "OK" }]);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <View style={styles.headerActions}>
          <Animated.View style={{ transform: [{ scale: micPulse }] }}>
            <Pressable
              style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
              onPress={() => { resetForm(); setShowAdd(true); setTimeout(() => handleVoiceInput("all"), 300); }}
            >
              <Feather name="mic" size={20} color={isListening ? "#fff" : C.primary} />
            </Pressable>
          </Animated.View>
          <Pressable style={styles.addBtn} onPress={() => { resetForm(); setShowAdd(true); }}>
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {isListening && (
        <View style={styles.listeningBanner}>
          <Feather name="mic" size={16} color="#fff" />
          <Text style={styles.listeningText}>
            {voiceTarget === "all"
              ? 'Listening... Say "tomato 50 kg 30 rupees"'
              : `Listening for product ${voiceTarget}...`}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="sprout-outline" size={64} color={C.border} />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptyText}>Tap "Add" or press the mic to add your first product</Text>
          <Pressable style={styles.addFirstBtn} onPress={() => { resetForm(); setShowAdd(true); }}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addFirstBtnText}>Add Your First Product</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard product={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item.id)} />
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editProduct ? "Edit Product" : "Add New Product"}</Text>
            <Pressable onPress={() => { setShowAdd(false); resetForm(); }}>
              <Feather name="x" size={24} color={C.text} />
            </Pressable>
          </View>

          <View style={styles.voiceHint}>
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <Feather name="mic" size={18} color={isListening ? "#fff" : C.primary} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.voiceHintText, isListening && { color: "#fff" }]}>
                {isListening
                  ? voiceTarget === "all"
                    ? 'Say: "tomato 50 kilo 30 rupees"'
                    : `Listening for ${voiceTarget}...`
                  : "Smart voice fill — say name, qty & price at once"}
              </Text>
              {recognizedText !== "" && !isListening && (
                <Text style={styles.recognizedText}>Heard: "{recognizedText}"</Text>
              )}
            </View>
            <Pressable
              style={[styles.voiceHintBtn, isListening && { backgroundColor: "#C62828" }]}
              onPress={() => handleVoiceInput("all")}
            >
              <Text style={styles.voiceHintBtnText}>{isListening ? "Stop" : "🎙 Smart Fill"}</Text>
            </Pressable>
          </View>

          <FormInput
            label="Product Name *"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g., Fresh Tomatoes"
            showMic
            onMic={() => handleVoiceInput("name")}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Price (₹) *" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput label="Quantity *" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} placeholder="0" keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Unit</Text>
          <View style={styles.chipRow}>
            {["kg", "g", "dozen", "piece", "liter", "quintal"].map(u => (
              <Pressable
                key={u}
                style={[styles.chip, form.unit === u && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, unit: u }))}
              >
                <Text style={[styles.chipText, form.unit === u && styles.chipTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, category: cat }))}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </View>

          <FormInput
            label="Description"
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
            placeholder="Describe your product..."
            multiline
            showMic
            onMic={() => handleVoiceInput("description")}
          />
          <FormInput label="Image URL" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." />
          <FormInput label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} placeholder="Village/City" />

          <Pressable style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.85 : 1 }]} onPress={handleSave}>
            <Feather name={editProduct ? "save" : "plus-circle"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{editProduct ? "Save Changes" : "Add Product"}</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={pcStyles.card}>
      <View style={pcStyles.left}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={pcStyles.image} />
        ) : (
          <View style={pcStyles.imagePlaceholder}>
            <MaterialCommunityIcons name="image-outline" size={28} color={C.border} />
          </View>
        )}
      </View>
      <View style={pcStyles.info}>
        <View style={pcStyles.topRow}>
          <Text style={pcStyles.name} numberOfLines={1}>{product.name}</Text>
          <View style={[pcStyles.badge, { backgroundColor: product.available ? "#E8F5E9" : "#FFEBEE" }]}>
            <Text style={[pcStyles.badgeText, { color: product.available ? "#2E7D32" : "#C62828" }]}>
              {product.available ? "Active" : "Paused"}
            </Text>
          </View>
        </View>
        <Text style={pcStyles.category}>{product.category}</Text>
        <View style={pcStyles.priceRow}>
          <Text style={pcStyles.price}>₹{product.price}/{product.unit}</Text>
          <Text style={pcStyles.qty}>{product.quantity} {product.unit} avail.</Text>
        </View>
      </View>
      <View style={pcStyles.actions}>
        <Pressable style={pcStyles.actionBtn} onPress={onEdit}>
          <Feather name="edit-2" size={16} color={C.primary} />
        </Pressable>
        <Pressable style={[pcStyles.actionBtn, { backgroundColor: "#FFEBEE" }]} onPress={onDelete}>
          <Feather name="trash-2" size={16} color="#C62828" />
        </Pressable>
      </View>
    </View>
  );
}

function FormInput({
  label, value, onChange, placeholder, keyboardType, multiline, showMic, onMic,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
  showMic?: boolean; onMic?: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {showMic && onMic && (
          <Pressable onPress={onMic} style={styles.fieldMicBtn}>
            <Feather name="mic" size={14} color={C.primary} />
          </Pressable>
        )}
      </View>
      <TextInput
        style={[styles.formInput, multiline && { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
      />
    </View>
  );
}

const pcStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  left: {},
  image: { width: 64, height: 64, borderRadius: 10 },
  imagePlaceholder: {
    width: 64, height: 64, borderRadius: 10, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  category: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  priceRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 2 },
  price: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.primary },
  qty: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  actions: { gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  voiceBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.border,
  },
  voiceBtnActive: { backgroundColor: "#C62828", borderColor: "#C62828" },
  addBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.primary,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 6,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listeningBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#C62828", marginHorizontal: 20, borderRadius: 10,
    padding: 10, marginBottom: 8,
  },
  listeningText: { color: "#fff", fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", paddingHorizontal: 32 },
  addFirstBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  addFirstBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalContainer: { flex: 1, backgroundColor: C.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16, paddingTop: 16,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  voiceHint: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.paleGreen, borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: "#A5D6A7",
  },
  voiceHintText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.primary },
  recognizedText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555", marginTop: 3, fontStyle: "italic" },
  voiceHintBtn: {
    backgroundColor: C.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  voiceHintBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  row: { flexDirection: "row", gap: 10 },
  fieldLabel: {
    fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  fieldMicBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16, marginTop: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.paleGreen, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  chipTextActive: { color: "#fff" },
  formInput: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, height: 50, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14, height: 54, marginTop: 10,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
