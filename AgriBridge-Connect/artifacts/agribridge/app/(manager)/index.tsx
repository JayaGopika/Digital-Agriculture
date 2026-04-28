import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import Colors from "@/constants/colors";

const C = Colors.light;
const M = C.managerBadge;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadData() {
    try {
      const [bookings, storages] = await Promise.all([
        apiFetch("/storage/bookings"),
        apiFetch("/storage"),
      ]);
      const myStorages = storages.filter((s: any) => s.managerId === user?.id);
      const myBookings = bookings.filter((b: any) => myStorages.some((s: any) => s.id === b.storageId));
      const pending = myBookings.filter((b: any) => b.status === "pending");
      const approved = myBookings.filter((b: any) => b.status === "approved");
      const revenue = myBookings.filter((b: any) => b.status === "approved")
        .reduce((sum: number, b: any) => sum + parseFloat(b.totalCost || "0"), 0);
      setStats({
        totalStorages: myStorages.length,
        pendingBookings: pending.length,
        activeBookings: approved.length,
        totalRevenue: revenue,
        totalBookings: myBookings.length,
      });
      setRecentBookings(myBookings.slice(0, 5));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={M} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.name}>{user?.name?.split(" ")[0] ?? "Manager"}</Text>
          <Text style={styles.role}>Storage Manager</Text>
        </View>
        <View style={[styles.avatarBox, { backgroundColor: M }]}>
          <Text style={styles.avatarText}>{(user?.name ?? "M")[0].toUpperCase()}</Text>
        </View>
      </View>

      <View style={[styles.heroBanner, { backgroundColor: M }]}>
        <MaterialCommunityIcons name="snowflake" size={32} color="rgba(255,255,255,0.8)" />
        <View>
          <Text style={styles.heroTitle}>Cold Chain Management</Text>
          <Text style={styles.heroSub}>Keep the harvest fresh</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={M} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="snowflake" label="My Storages" value={stats?.totalStorages ?? 0} color={M} iconSet="community" />
            <StatCard icon="clock" label="Pending" value={stats?.pendingBookings ?? 0} color="#FF9800" iconSet="feather" />
            <StatCard icon="check-circle" label="Active" value={stats?.activeBookings ?? 0} color="#4CAF50" iconSet="feather" />
            <StatCard icon="trending-up" label="Revenue" value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`} color={M} iconSet="feather" large />
          </View>

          {(stats?.pendingBookings ?? 0) > 0 && (
            <View style={[styles.alertBanner, { borderColor: "#FFE0B2", backgroundColor: "#FFF8F0" }]}>
              <View style={[styles.alertDot, { backgroundColor: "#FF9800" }]} />
              <Text style={styles.alertText}>
                {stats?.pendingBookings} booking request{stats?.pendingBookings !== 1 ? "s" : ""} awaiting approval
              </Text>
              <Feather name="chevron-right" size={16} color="#FF9800" />
            </View>
          )}

          {recentBookings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Requests</Text>
              {recentBookings.map(b => {
                const statusColor = {
                  pending: "#FF9800", approved: "#4CAF50", rejected: "#F44336", cancelled: "#9E9E9E",
                }[b.status as string] ?? "#9E9E9E";
                return (
                  <View key={b.id} style={styles.recentCard}>
                    <View style={[styles.recentDot, { backgroundColor: statusColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName}>{b.farmerName ?? "Farmer"}</Text>
                      <Text style={styles.recentDetail}>{b.productName} • {b.quantity}kg</Text>
                    </View>
                    <View style={[styles.recentBadge, { backgroundColor: `${statusColor}20` }]}>
                      <Text style={[styles.recentBadgeText, { color: statusColor }]}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, iconSet, large }: {
  icon: string; label: string; value: string | number; color: string; iconSet: "feather" | "community"; large?: boolean;
}) {
  return (
    <View style={[styles.statCard, large && styles.statCardLarge]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        {iconSet === "feather"
          ? <Feather name={icon as any} size={20} color={color} />
          : <MaterialCommunityIcons name={icon as any} size={20} color={color} />}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  role: { fontSize: 13, fontFamily: "Inter_500Medium", color: M, marginTop: 2 },
  avatarBox: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  heroTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  statCardLarge: { minWidth: "100%" },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#795548" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  recentDot: { width: 10, height: 10, borderRadius: 5 },
  recentName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  recentDetail: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  recentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  recentBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
