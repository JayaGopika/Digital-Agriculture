import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

const ADMIN_COLOR = "#1A237E";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="users">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Users</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <Icon sf={{ default: "leaf", selected: "leaf.fill" }} />
        <Label>Products</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="storage">
        <Icon sf={{ default: "snowflake", selected: "snowflake" }} />
        <Label>Storage</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ADMIN_COLOR,
        tabBarInactiveTintColor: "#9CAD9F",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: "#E2EAE4",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="chart.bar" tintColor={color} size={22} />
          : <Feather name="bar-chart-2" size={22} color={color} />,
      }} />
      <Tabs.Screen name="users" options={{
        title: "Users",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="person.2" tintColor={color} size={22} />
          : <Feather name="users" size={22} color={color} />,
      }} />
      <Tabs.Screen name="products" options={{
        title: "Products",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="leaf" tintColor={color} size={22} />
          : <Feather name="package" size={22} color={color} />,
      }} />
      <Tabs.Screen name="orders" options={{
        title: "Orders",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="bag" tintColor={color} size={22} />
          : <Feather name="shopping-bag" size={22} color={color} />,
      }} />
      <Tabs.Screen name="storage" options={{
        title: "Storage",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="snowflake" tintColor={color} size={22} />
          : <Feather name="database" size={22} color={color} />,
      }} />
    </Tabs>
  );
}

export default function AdminLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
