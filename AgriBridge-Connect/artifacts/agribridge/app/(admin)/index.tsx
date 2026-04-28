import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, Pressable, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";

const ADMIN = "#1A237E";
const ADMIN_LIGHT = "#E8EAF6";

interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  totalCustomers: number;
  totalManagers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalStorages: number;
  totalBookings: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of your admin account?")) logout();
    } else {
      Alert.alert("Sign Out", "Sign out of your admin account?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]);
    }
  }

  async function loadStats() {
    try {
      const data = await apiFetch("/admin/stats");
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadStats(); }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={ADMIN} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.name}>Welcome, {user?.name?.split(" ")[0] ?? "Admin"}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={16} color="#B71C1C" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </Pressable>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{(user?.name ?? "A")[0].toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.heroBanner}>
        <Feather name="shield" size={28} color="rgba(255,255,255,0.9)" />
        <View>
          <Text style={styles.heroTitle}>AgriBridge Control Center</Text>
          <Text style={styles.heroSub}>Full platform oversight & management</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="users" label="Total Users" value={stats?.totalUsers ?? 0} color={ADMIN} />
            <StatCard icon="trending-up" label="Total Orders" value={stats?.totalOrders ?? 0} color="#E65100" />
            <StatCard icon="dollar-sign" label="Revenue" value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`} color="#1B5E20" large />
            <StatCard icon="alert-circle" label="Pending Orders" value={stats?.pendingOrders ?? 0} color="#F44336" />
            <StatCard icon="database" label="Storages" value={stats?.totalStorages ?? 0} color="#0D47A1" />
          </View>

          <Text style={styles.sectionTitle}>User Breakdown</Text>
          <View style={styles.userBreakdown}>
            <UserTypeCard icon="🌾" label="Farmers" value={stats?.totalFarmers ?? 0} color="#2D6A4F" bg="#E8F5E9" />
            <UserTypeCard icon="🛒" label="Customers" value={stats?.totalCustomers ?? 0} color="#1565C0" bg="#E3F2FD" />
            <UserTypeCard icon="❄️" label="Managers" value={stats?.totalManagers ?? 0} color="#6A1B9A" bg="#F3E5F5" />
          </View>

          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStats}>
            <QuickStat label="Products Listed" value={stats?.totalProducts ?? 0} icon="package" />
            <QuickStat label="Storage Bookings" value={stats?.totalBookings ?? 0} icon="calendar" />
            <QuickStat label="Active Orders" value={(stats?.totalOrders ?? 0) - (stats?.pendingOrders ?? 0)} icon="check-circle" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, large }: {
  icon: string; label: string; value: string | number; color: string; large?: boolean;
}) {
  return (
    <View style={[styles.statCard, large && styles.statCardLarge]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function UserTypeCard({ icon, label, value, color, bg }: { icon: string; label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.userCard, { backgroundColor: bg }]}>
      <Text style={styles.userEmoji}>{icon}</Text>
      <Text style={[styles.userValue, { color }]}>{value}</Text>
      <Text style={[styles.userLabel, { color }]}>{label}</Text>
    </View>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <View style={styles.quickCard}>
      <Feather name={icon as any} size={18} color={ADMIN} />
      <View>
        <Text style={styles.quickValue}>{value}</Text>
        <Text style={styles.quickLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5FF" },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7986CB" },
  name: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#1A237E" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  logoutBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#B71C1C" },
  avatarBox: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: ADMIN,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: ADMIN,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  heroTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1A237E", marginBottom: 12, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  statCardLarge: { minWidth: "100%" },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#1A237E" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7986CB" },
  userBreakdown: { flexDirection: "row", gap: 10, marginBottom: 24 },
  userCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  userEmoji: { fontSize: 24 },
  userValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  userLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  quickStats: { gap: 10, marginBottom: 20 },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  quickValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1A237E" },
  quickLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7986CB" },
});
