import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

const ICONS = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
  warning: "alert-circle",
};

const COLORS = {
  success: { bg: "#2D6A4F", icon: "#B7E4C7" },
  error: { bg: "#C62828", icon: "#FFCDD2" },
  info: { bg: "#1565C0", icon: "#BBDEFB" },
  warning: { bg: "#E65100", icon: "#FFE0B2" },
};

interface ToastProps {
  visible: boolean;
  message: string;
  type?: keyof typeof COLORS;
}

export function Toast({ visible, message, type = "success" }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 30, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const c = COLORS[type];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: c.bg }]}>
        <Feather name={ICONS[type] as any} size={18} color={c.icon} />
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 110 : 100,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    maxWidth: 380,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 19,
  },
});
