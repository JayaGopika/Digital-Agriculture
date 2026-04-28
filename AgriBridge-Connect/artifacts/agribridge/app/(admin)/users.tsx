import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Platform, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";

const ADMIN = "#1A237E";

const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  farmer: { color: "#2D6A4F", bg: "#E8F5E9", label: "Farmer" },
  customer: { color: "#1565C0", bg: "#E3F2FD", label: "Customer" },
  storage_manager: { color: "#6A1B9A", bg: "#F3E5F5", label: "Manager" },
  admin: { color: "#B71C1C", bg: "#FFEBEE", label: "Admin" },
};

interface UserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  location?: string;
  farmName?: string;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadUsers() {
    try {
      const data = await apiFetch("/admin/users");
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleToggleBlock(user: UserItem) {
    const action = user.isBlocked ? "unblock" : "block";
    const confirmed = Platform.OS === "web"
      ? window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`)
      : true;
    if (!confirmed) return;

    setActionLoading(user.id);
    try {
      await apiFetch(`/admin/users/${user.id}/toggle-block`, { method: "PUT" });
      showToast(`${user.name} has been ${action}ed`, user.isBlocked ? "success" : "warning");
      loadUsers();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(user: UserItem) {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`Permanently delete ${user.name}?`)
      : true;
    if (!confirmed) return;

    setActionLoading(user.id);
    try {
      await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      showToast(`${user.name} deleted`, "info");
      loadUsers();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all"
      ? true
      : filterStatus === "blocked" ? u.isBlocked : !u.isBlocked;
    return matchSearch && matchRole && matchStatus;
  });

  const blockedCount = users.filter(u => u.isBlocked).length;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Users</Text>
          <Text style={styles.subtitle}>{users.length} total · {blockedCount} blocked</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={16} color="#7986CB" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color="#9E9E9E" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {["all", "farmer", "customer", "storage_manager", "admin"].map(r => (
          <Pressable
            key={r}
            style={[styles.filterChip, filterRole === r && styles.filterChipActive]}
            onPress={() => setFilterRole(r)}
          >
            <Text style={[styles.filterChipText, filterRole === r && styles.filterChipTextActive]}>
              {r === "all" ? "All" : r === "storage_manager" ? "Manager" : r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusFilterRow}>
        {(["all", "active", "blocked"] as const).map(s => (
          <Pressable
            key={s}
            style={[
              styles.statusChip,
              filterStatus === s && (s === "blocked" ? styles.statusChipBlocked : styles.statusChipActive),
            ]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[
              styles.statusChipText,
              filterStatus === s && (s === "blocked" ? styles.statusChipTextBlocked : styles.statusChipTextActive),
            ]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 10 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} tintColor={ADMIN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={48} color="#C5CAE9" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const rc = ROLE_CONFIG[item.role] ?? { color: "#333", bg: "#eee", label: item.role };
            const isProcessing = actionLoading === item.id;
            return (
              <View style={[styles.userCard, item.isBlocked && styles.userCardBlocked]}>
                <View style={[styles.avatar, { backgroundColor: item.isBlocked ? "#FFCDD2" : rc.bg }]}>
                  <Text style={[styles.avatarText, { color: item.isBlocked ? "#C62828" : rc.color }]}>
                    {item.name[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, item.isBlocked && styles.userNameBlocked]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                      <Text style={[styles.roleText, { color: rc.color }]}>{rc.label}</Text>
                    </View>
                    {item.isBlocked && (
                      <View style={styles.blockedBadge}>
                        <Feather name="slash" size={9} color="#C62828" />
                        <Text style={styles.blockedBadgeText}>Blocked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                  <View style={styles.metaRow}>
                    {item.phone && (
                      <View style={styles.metaItem}>
                        <Feather name="phone" size={11} color="#9E9E9E" />
                        <Text style={styles.metaText}>{item.phone}</Text>
                      </View>
                    )}
                    {item.location && (
                      <View style={styles.metaItem}>
                        <Feather name="map-pin" size={11} color="#9E9E9E" />
                        <Text style={styles.metaText}>{item.location}</Text>
                      </View>
                    )}
                  </View>
                  {item.farmName && (
                    <Text style={styles.farmName}>{item.farmName}</Text>
                  )}
                  <View style={styles.actionRow}>
                    <Pressable
                      style={[styles.blockBtn, item.isBlocked ? styles.unblockBtn : styles.blockBtnRed]}
                      onPress={() => handleToggleBlock(item)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={item.isBlocked ? "#2D6A4F" : "#E53935"} />
                      ) : (
                        <>
                          <Feather
                            name={item.isBlocked ? "unlock" : "lock"}
                            size={12}
                            color={item.isBlocked ? "#2D6A4F" : "#E53935"}
                          />
                          <Text style={[styles.blockBtnText, { color: item.isBlocked ? "#2D6A4F" : "#E53935" }]}>
                            {item.isBlocked ? "Unblock" : "Block"}
                          </Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item)}
                      disabled={isProcessing}
                    >
                      <Feather name="trash-2" size={14} color="#F44336" />
                    </Pressable>
                  </View>
                </View>
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
  container: { flex: 1, backgroundColor: "#F5F5FF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: ADMIN },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7986CB", marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8EAF6",
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1A237E" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 8, flexWrap: "wrap" },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "#E8EAF6", borderWidth: 1, borderColor: "#C5CAE9",
  },
  filterChipActive: { backgroundColor: ADMIN, borderColor: ADMIN },
  filterChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#5C6BC0" },
  filterChipTextActive: { color: "#fff" },
  statusFilterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 12 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E0E0E0",
  },
  statusChipActive: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  statusChipBlocked: { backgroundColor: "#FFEBEE", borderColor: "#EF9A9A" },
  statusChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#757575" },
  statusChipTextActive: { color: "#2E7D32" },
  statusChipTextBlocked: { color: "#C62828" },
  userCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  userCardBlocked: {
    backgroundColor: "#FFF8F8",
    borderColor: "#FFCDD2",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1A237E", maxWidth: "55%" },
  userNameBlocked: { color: "#B71C1C", textDecorationLine: "line-through" },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  blockedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FFEBEE", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  blockedBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#C62828" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7986CB", marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 4, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9E9E9E" },
  farmName: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#5C6BC0", marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  blockBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, minWidth: 80, justifyContent: "center",
  },
  blockBtnRed: { backgroundColor: "#FFF8F8", borderColor: "#FFCDD2" },
  unblockBtn: { backgroundColor: "#F1F8E9", borderColor: "#C5E1A5" },
  blockBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center",
  },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#7986CB" },
});
