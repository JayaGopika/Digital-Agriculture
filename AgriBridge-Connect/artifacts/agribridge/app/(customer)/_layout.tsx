import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, Badge, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";

const C = Colors.light;

function NativeTabLayout() {
  const { itemCount } = useCart();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Browse</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon sf={{ default: "cart", selected: "cart.fill" }} />
        <Label>Cart</Label>
        {itemCount > 0 && <Badge>{String(itemCount)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>Orders</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { itemCount } = useCart();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: C.border,
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
        title: "Browse",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="house" tintColor={color} size={22} />
          : <Feather name="home" size={22} color={color} />,
      }} />
      <Tabs.Screen name="cart" options={{
        title: "Cart",
        tabBarBadge: itemCount > 0 ? itemCount : undefined,
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="cart" tintColor={color} size={22} />
          : <Feather name="shopping-cart" size={22} color={color} />,
      }} />
      <Tabs.Screen name="orders" options={{
        title: "Orders",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="bag" tintColor={color} size={22} />
          : <Feather name="package" size={22} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="person" tintColor={color} size={22} />
          : <Feather name="user" size={22} color={color} />,
      }} />
    </Tabs>
  );
}

export default function CustomerLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
