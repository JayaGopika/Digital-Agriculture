import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";

const ADMIN = "#1A237E";

interface AdminStorage {
  id: number;
  name: string;
  location: string;
  totalCapacity: string;
  availableCapacity: string;
  pricePerKgPerDay: string;
  available: boolean;
  createdAt: string;
  managerName?: string;
}

export default function AdminStorage() {
  const { apiFetch } = useApi();
  const insets = useSafeAreaInsets();
  const [storages, setStorages] = useState<AdminStorage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function loadStorages() {
    try {
      const data = await apiFetch("/admin/storage");
      setStorages(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { loadStorages(); }, []);

  async function handleDelete(id: number, name: string) {
    Alert.alert("Delete Storage", `Remove "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/admin/storage/${id}`, { method: "DELETE" });
            loadStorages();
          } catch (e: unknown) {
            Alert.alert("Error", (e as Error).message);
          }
        }
      }
    ]);
  }

  const totalCapacity = storages.reduce((sum, s) => sum + parseFloat(s.totalCapacity), 0);
  const availableCapacity = storages.reduce((sum, s) => sum + parseFloat(s.availableCapacity), 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Cold Storage</Text>
        <Text style={styles.count}>{storages.length} centers</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="snowflake" size={18} color="#2196F3" />
          <Text style={styles.summaryVal}>{totalCapacity.toFixed(0)}T</Text>
          <Text style={styles.summaryLabel}>Total Capacity</Text>
        </View>
        <View style={styles.summaryCard}>
          <Feather name="check-circle" size={18} color="#4CAF50" />
          <Text style={styles.summaryVal}>{availableCapacity.toFixed(0)}T</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
        <View style={styles.summaryCard}>
          <Feather name="percent" size={18} color={ADMIN} />
          <Text style={styles.summaryVal}>
            {totalCapacity > 0 ? ((availableCapacity / totalCapacity) * 100).toFixed(0) : 0}%
          </Text>
          <Text style={styles.summaryLabel}>Free Space</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={storages}
          keyExtractor={s => s.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 118 : insets.bottom + 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStorages(); }} tintColor={ADMIN} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="snowflake" size={52} color="#C5CAE9" />
              <Text style={styles.emptyText}>No storage centers found</Text>
            </View>
          }
          renderItem={({ item }) => {
            const usedPct = totalCapacity > 0
              ? ((parseFloat(item.totalCapacity) - parseFloat(item.availableCapacity)) / parseFloat(item.totalCapacity)) * 100
              : 0;
            return (
              <View style={styles.storageCard}>
                <View style={styles.cardTop}>
                  <View style={styles.storageIcon}>
                    <MaterialCommunityIcons name="snowflake" size={22} color="#2196F3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storageName}>{item.name}</Text>
                    <View style={styles.locationRow}>
                      <Feather name="map-pin" size={12} color="#7986CB" />
                      <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                    {item.managerName && (
                      <Text style={styles.managerText}>by {item.managerName}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.available ? "#E8F5E9" : "#FFEBEE" }]}>
                    <Text style={{ color: item.available ? "#2E7D32" : "#C62828", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                      {item.available ? "Open" : "Closed"}
                    </Text>
                  </View>
                </View>

                <View style={styles.capacityRow}>
                  <View style={styles.capacityBar}>
                    <View style={[styles.capacityFill, { width: `${Math.min(100, 100 - usedPct)}%` as any }]} />
                  </View>
                  <Text style={styles.capacityText}>
                    {item.availableCapacity}T / {item.totalCapacity}T
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, { color: ADMIN }]}>₹{item.pricePerKgPerDay}</Text>
                    <Text style={styles.statLabel}>Per kg/day</Text>
                  </View>
                  <Text style={styles.addedDate}>
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
                  <Feather name="trash-2" size={15} color="#F44336" />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
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
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: ADMIN },
  count: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#7986CB" },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  summaryVal: { fontSize: 16, fontFamily: "Inter_700Bold", color: ADMIN },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#7986CB", textAlign: "center" },
  storageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  storageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  storageName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: ADMIN },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  locationText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7986CB" },
  managerText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9E9E9E", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  capacityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  capacityBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E8EAF6",
    borderRadius: 4,
    overflow: "hidden",
  },
  capacityFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 4 },
  capacityText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#1A237E", minWidth: 80 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stat: {},
  statVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#7986CB" },
  addedDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#BDBDBD" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF8F8",
  },
  deleteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#F44336" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#7986CB" },
});
