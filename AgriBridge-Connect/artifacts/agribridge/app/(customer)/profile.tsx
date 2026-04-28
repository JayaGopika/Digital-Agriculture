import React, { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function CustomerProfile() {
  const { user, logout, updateUser } = useAuth();
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? "",
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    setLoading(true);
    try {
      const updated = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      updateUser(updated);
      setEditing(false);
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Pressable style={styles.editBtn} onPress={() => editing ? setEditing(false) : setEditing(true)}>
          <Feather name={editing ? "x" : "edit-2"} size={18} color={editing ? "#F44336" : C.primary} />
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: C.customerBadge }]}>
          <Text style={styles.avatarText}>{(user?.name ?? "C")[0].toUpperCase()}</Text>
        </View>
        <View style={[styles.roleTag, { backgroundColor: C.customerBadge }]}>
          <Text style={styles.roleText}>Customer</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        {[
          { label: "Full Name", icon: "user", field: "name", keyboardType: undefined },
          { label: "Phone", icon: "phone", field: "phone", keyboardType: "phone-pad" },
          { label: "Location", icon: "map-pin", field: "location", keyboardType: undefined },
        ].map((f, idx, arr) => (
          <View key={f.field} style={[styles.fieldRow, idx < arr.length - 1 && styles.fieldBorder]}>
            <View style={[styles.fieldIcon, { backgroundColor: `${C.customerBadge}15` }]}>
              <Feather name={f.icon as any} size={16} color={C.customerBadge} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form[f.field as keyof typeof form]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.field]: v }))}
                  keyboardType={f.keyboardType as any || "default"}
                  placeholderTextColor={C.textMuted}
                />
              ) : (
                <Text style={styles.fieldValue}>{(user as any)?.[f.field] || "Not set"}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {editing && (
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: C.customerBadge, opacity: pressed ? 0.85 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => {
          if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to logout?")) logout();
            return;
          }
          Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: logout },
          ]);
        }}
      >
        <Feather name="log-out" size={18} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  editBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.paleGreen,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border,
  },
  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  roleTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  card: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  fieldRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  fieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  input: {
    fontSize: 15, fontFamily: "Inter_400Regular", color: C.text,
    borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4, backgroundColor: C.background,
  },
  saveBtn: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 16 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#FFCDD2", backgroundColor: "#FFF8F8",
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#F44336" },
});
