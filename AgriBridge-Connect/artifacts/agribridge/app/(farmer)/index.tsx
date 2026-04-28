import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const C = Colors.light;

interface FarmerStats {
  totalProducts: number;
  totalOrders: number;
  totalEarnings: number;
  storageBookings: number;
  pendingOrders: number;
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const { apiFetch } = useApi();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats() {
    try {
      const data = await apiFetch("/users/farmer-stats");
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadStats(); }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) {
        logout();
      }
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  }

  const ACTIONS = [
    {
      icon: "plus-circle", label: "Add Product", iconSet: "feather", color: C.primary,
      onPress: () => router.push("/(farmer)/products"),
    },
    {
      icon: "mic", label: "Voice Input", iconSet: "feather", color: "#9C27B0",
      onPress: () => {
        router.push("/(farmer)/products");
        showToast("Tap the mic on Products page", "info");
      },
    },
    {
      icon: "shopping-bag", label: "View Orders", iconSet: "feather", color: C.accent,
      onPress: () => router.push("/(farmer)/orders"),
    },
    {
      icon: "snowflake", label: "Book Storage", iconSet: "community", color: "#2196F3",
      onPress: () => router.push("/(farmer)/storage"),
    },
    {
      icon: "user", label: "Profile", iconSet: "feather", color: "#607D8B",
      onPress: () => router.push("/(farmer)/profile"),
    },
    {
      icon: "log-out", label: "Logout", iconSet: "feather", color: "#F44336",
      onPress: handleLogout,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { paddingTop: topPad }]}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 84 + 34 : insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{user?.name?.split(" ")[0] ?? "Farmer"}</Text>
            {user?.farmName && <Text style={styles.farmName}>{user.farmName}</Text>}
          </View>
          <Pressable style={styles.avatarBox} onPress={handleLogout}>
            <Text style={styles.avatarText}>{(user?.name ?? "F")[0].toUpperCase()}</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="package" label="Products" value={stats?.totalProducts ?? 0} color={C.primary} iconSet="feather" />
              <StatCard icon="shopping-cart" label="Total Orders" value={stats?.totalOrders ?? 0} color={C.accent} iconSet="feather" />
              <StatCard icon="trending-up" label="Earnings" value={`₹${(stats?.totalEarnings ?? 0).toLocaleString()}`} color="#27AE60" iconSet="feather" large />
              <StatCard icon="snowflake" label="Storage Bookings" value={stats?.storageBookings ?? 0} color="#2196F3" iconSet="community" />
            </View>

            {(stats?.pendingOrders ?? 0) > 0 && (
              <Pressable style={styles.alertBanner} onPress={() => router.push("/(farmer)/orders")}>
                <View style={[styles.alertDot, { backgroundColor: "#FF9800" }]} />
                <Text style={styles.alertText}>
                  {stats?.pendingOrders} pending order{stats?.pendingOrders !== 1 ? "s" : ""} need attention
                </Text>
                <Feather name="chevron-right" size={16} color="#FF9800" />
              </Pressable>
            )}

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map((action) => (
                <ActionCard
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  iconSet={action.iconSet as any}
                  color={action.color}
                  onPress={action.onPress}
                />
              ))}
            </View>

            <View style={styles.tipCard}>
              <MaterialCommunityIcons name="lightbulb-outline" size={22} color={C.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.tipTitle}>Tip of the Day</Text>
                <Text style={styles.tipText}>
                  Upload product photos to attract more customers. Products with images get 3x more views!
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

function StatCard({
  icon, label, value, color, iconSet, large,
}: {
  icon: string; label: string; value: string | number; color: string; iconSet: "feather" | "community"; large?: boolean;
}) {
  return (
    <View style={[styles.statCard, large && styles.statCardLarge]}>
      <View style={[styles.statIconBox, { backgroundColor: `${color}15` }]}>
        {iconSet === "feather"
          ? <Feather name={icon as any} size={20} color={color} />
          : <MaterialCommunityIcons name={icon as any} size={20} color={color} />}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon, label, iconSet, color, onPress,
}: {
  icon: string; label: string; iconSet: "feather" | "community"; color: string; onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionCard, { opacity: pressed ? 0.75 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        {iconSet === "feather"
          ? <Feather name={icon as any} size={22} color={color} />
          : <MaterialCommunityIcons name={icon as any} size={22} color={color} />}
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingVertical: 20,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  farmName: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.primary, marginTop: 2 },
  avatarBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: "44%", backgroundColor: C.card, borderRadius: 16,
    padding: 16, gap: 8, borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statCardLarge: { minWidth: "100%" },
  statIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  alertBanner: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8E1",
    borderRadius: 12, padding: 14, marginBottom: 20, gap: 10,
    borderWidth: 1, borderColor: "#FFECB3",
  },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#795548" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  actionCard: {
    flex: 1, minWidth: "44%", backgroundColor: C.card, borderRadius: 14,
    padding: 16, alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  tipCard: {
    flexDirection: "row", gap: 12, backgroundColor: "#FFFDE7", borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: "#FFF9C4", alignItems: "flex-start",
  },
  tipTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
});
