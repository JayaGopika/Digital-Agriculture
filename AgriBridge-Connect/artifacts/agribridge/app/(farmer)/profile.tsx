import React, { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function FarmerProfile() {
  const { user, logout, updateUser } = useAuth();
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? "",
    farmName: user?.farmName ?? "",
    bio: user?.bio ?? "",
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
      showToast("Profile updated successfully", "success");
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) {
        logout();
      }
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!editing ? (
          <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
            <Feather name="edit-2" size={18} color={C.primary} />
          </Pressable>
        ) : (
          <Pressable style={styles.editBtn} onPress={() => setEditing(false)}>
            <Feather name="x" size={18} color="#F44336" />
          </Pressable>
        )}
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? "F")[0].toUpperCase()}</Text>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Farmer</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <ProfileField
          label="Full Name"
          icon="user"
          value={editing ? form.name : (user?.name ?? "")}
          editing={editing}
          onChange={v => setForm(f => ({ ...f, name: v }))}
        />
        <ProfileField
          label="Phone"
          icon="phone"
          value={editing ? form.phone : (user?.phone ?? "Not set")}
          editing={editing}
          onChange={v => setForm(f => ({ ...f, phone: v }))}
          keyboardType="phone-pad"
        />
        <ProfileField
          label="Location"
          icon="map-pin"
          value={editing ? form.location : (user?.location ?? "Not set")}
          editing={editing}
          onChange={v => setForm(f => ({ ...f, location: v }))}
        />
        <ProfileField
          label="Farm Name"
          icon="home"
          value={editing ? form.farmName : (user?.farmName ?? "Not set")}
          editing={editing}
          onChange={v => setForm(f => ({ ...f, farmName: v }))}
          isLast
        />
      </View>

      {(editing || user?.bio) && (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.fieldLabel}>Bio</Text>
          {editing ? (
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
              value={form.bio}
              onChangeText={v => setForm(f => ({ ...f, bio: v }))}
              placeholder="Tell customers about your farm..."
              placeholderTextColor={C.textMuted}
              multiline
            />
          ) : (
            <Text style={styles.bioText}>{user?.bio ?? ""}</Text>
          )}
        </View>
      )}

      {editing && (
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function ProfileField({
  label, icon, value, editing, onChange, keyboardType, isLast,
}: {
  label: string; icon: string; value: string; editing: boolean;
  onChange?: (v: string) => void; keyboardType?: any; isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, !isLast && styles.fieldBorder]}>
      <View style={styles.fieldIcon}>
        <Feather name={icon as any} size={16} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editing && onChange ? (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType || "default"}
            placeholderTextColor={C.textMuted}
          />
        ) : (
          <Text style={styles.fieldValue}>{value || "Not set"}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: C.farmerBadge,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  userName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.paleGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: C.background,
  },
  bioText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 20 },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF8F8",
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#F44336" },
});
