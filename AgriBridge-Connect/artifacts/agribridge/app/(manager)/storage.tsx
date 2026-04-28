import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Alert, ActivityIndicator, Modal, TextInput,
  ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.light;
const M = C.managerBadge;

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
  managerId?: number;
  available: boolean;
}

export default function ManagerStorage() {
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [storages, setStorages] = useState<StorageCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editStorage, setEditStorage] = useState<StorageCenter | null>(null);
  const [form, setForm] = useState({
    name: "", location: "", totalCapacity: "", availableCapacity: "",
    pricePerKgPerDay: "", temperature: "", phone: "", description: "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadStorages() {
    try {
      const all = await apiFetch("/storage");
      setStorages(all.filter((s: StorageCenter) => s.managerId === user?.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadStorages(); }, []);

  function openEdit(s: StorageCenter) {
    setEditStorage(s);
    setForm({
      name: s.name, location: s.location,
      totalCapacity: s.totalCapacity, availableCapacity: s.availableCapacity,
      pricePerKgPerDay: s.pricePerKgPerDay, temperature: s.temperature ?? "",
      phone: s.phone ?? "", description: s.description ?? "",
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: "", location: "", totalCapacity: "", availableCapacity: "", pricePerKgPerDay: "", temperature: "", phone: "", description: "" });
    setEditStorage(null);
  }

  async function handleSave() {
    if (!form.name || !form.location || !form.totalCapacity || !form.pricePerKgPerDay) {
      Alert.alert("Error", "Fill required fields");
      return;
    }
    try {
      if (editStorage) {
        await apiFetch(`/storage/${editStorage.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            totalCapacity: parseFloat(form.totalCapacity),
            availableCapacity: parseFloat(form.availableCapacity || form.totalCapacity),
            pricePerKgPerDay: parseFloat(form.pricePerKgPerDay),
          }),
        });
      } else {
        await apiFetch("/storage/add", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            totalCapacity: parseFloat(form.totalCapacity),
            availableCapacity: parseFloat(form.availableCapacity || form.totalCapacity),
            pricePerKgPerDay: parseFloat(form.pricePerKgPerDay),
          }),
        });
      }
      setShowAdd(false);
      resetForm();
      loadStorages();
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    }
  }

  async function handleToggle(s: StorageCenter) {
    try {
      await apiFetch(`/storage/${s.id}`, {
        method: "PUT",
        body: JSON.stringify({ available: !s.available }),
      });
      loadStorages();
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Storage Centers</Text>
        <Pressable style={styles.addBtn} onPress={() => { resetForm(); setShowAdd(true); }}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={M} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={storages}
          keyExtractor={s => s.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 14 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="snowflake" size={56} color={C.border} />
              <Text style={styles.emptyTitle}>No Storage Centers</Text>
              <Text style={styles.emptyText}>Add your cold storage facility to receive booking requests</Text>
              <Pressable style={[styles.addBtn, { marginTop: 8 }]} onPress={() => { resetForm(); setShowAdd(true); }}>
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add Storage</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.storageCard}>
              <View style={styles.storageTop}>
                <View style={[styles.storageIcon, { backgroundColor: `${M}15` }]}>
                  <MaterialCommunityIcons name="snowflake" size={26} color={M} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storageName}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={12} color={C.textMuted} />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.toggleBtn, { backgroundColor: item.available ? "#E8F5E9" : "#FFEBEE" }]}
                  onPress={() => handleToggle(item)}
                >
                  <View style={[styles.toggleDot, { backgroundColor: item.available ? "#4CAF50" : "#F44336" }]} />
                  <Text style={[styles.toggleText, { color: item.available ? "#4CAF50" : "#F44336" }]}>
                    {item.available ? "Open" : "Closed"}
                  </Text>
                </Pressable>
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
                  <Text style={[styles.statVal, { color: M }]}>₹{item.pricePerKgPerDay}</Text>
                  <Text style={styles.statLabel}>Per kg/day</Text>
                </View>
                {item.temperature && (
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: "#2196F3" }]}>{item.temperature}</Text>
                    <Text style={styles.statLabel}>Temp</Text>
                  </View>
                )}
              </View>

              {item.phone && (
                <View style={styles.phoneRow}>
                  <Feather name="phone" size={13} color={C.textMuted} />
                  <Text style={styles.phoneText}>{item.phone}</Text>
                </View>
              )}

              {item.description && (
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              )}

              <Pressable
                style={styles.editBtn}
                onPress={() => openEdit(item)}
              >
                <Feather name="edit-2" size={15} color={M} />
                <Text style={styles.editBtnText}>Edit Details</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <ScrollView
          style={styles.modalCont}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editStorage ? "Edit Storage" : "Add Storage Center"}</Text>
            <Pressable onPress={() => { setShowAdd(false); resetForm(); }}>
              <Feather name="x" size={24} color={C.text} />
            </Pressable>
          </View>

          {([
            { label: "Facility Name *", key: "name", placeholder: "e.g., AgroCool Warehouse" },
            { label: "Location *", key: "location", placeholder: "City/Village" },
            { label: "Total Capacity (Tonnes) *", key: "totalCapacity", placeholder: "0", numeric: true },
            { label: "Available Capacity (Tonnes)", key: "availableCapacity", placeholder: "0", numeric: true },
            { label: "Price per kg/day (₹) *", key: "pricePerKgPerDay", placeholder: "0.00", numeric: true },
            { label: "Temperature", key: "temperature", placeholder: "e.g., 2-8°C" },
            { label: "Contact Phone", key: "phone", placeholder: "+91..." },
            { label: "Description", key: "description", placeholder: "Describe your facility..." },
          ] as any[]).map(field => (
            <View key={field.key} style={{ marginBottom: 14 }}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.formInput}
                value={form[field.key as keyof typeof form]}
                onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor={C.textMuted}
                keyboardType={field.numeric ? "numeric" : "default"}
              />
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: M, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{editStorage ? "Save Changes" : "Add Storage Center"}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: M,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  addBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  storageCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  storageTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  storageIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  storageName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  locationText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleDot: { width: 7, height: 7, borderRadius: 4 },
  toggleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 20, paddingVertical: 4 },
  stat: { alignItems: "center" },
  statVal: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, marginTop: 2 },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  phoneText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: `${M}40`,
    backgroundColor: `${M}08`,
  },
  editBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: M },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  modalCont: { flex: 1, backgroundColor: C.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 12,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
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
  saveBtn: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 10 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
