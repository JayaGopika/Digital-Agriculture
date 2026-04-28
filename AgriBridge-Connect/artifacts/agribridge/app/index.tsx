import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
const C = Colors.light;
const SPLASH_DURATION = 3000;

export default function SplashPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(textFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }).start();
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: SPLASH_DURATION - 200,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setSplashDone(true);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashDone || isLoading) return;

    if (user) {
      if (user.role === "farmer") router.replace("/(farmer)");
      else if (user.role === "customer") router.replace("/(customer)");
      else if (user.role === "storage_manager") router.replace("/(manager)");
      else if (user.role === "admin") router.replace("/(admin)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [splashDone, isLoading, user]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, { opacity: textFade }]}>
        <Text style={styles.appName}>AgriBridge</Text>
        <Text style={styles.tagline}>Farm to Table, Direct</Text>
        <Text style={styles.subtitle}>Connecting farmers · customers · storage</Text>
      </Animated.View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FCF8",
    alignItems: "center",
    justifyContent: "center",
  },
  bgCircle1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(82, 183, 136, 0.12)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -80,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(212, 160, 23, 0.10)",
  },
  bgCircle3: {
    position: "absolute",
    top: "40%",
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(45, 106, 79, 0.06)",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  logo: {
    width: width * 0.68,
    height: 160,
  },
  taglineContainer: {
    alignItems: "center",
    gap: 6,
    marginBottom: 60,
    paddingHorizontal: 32,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: C.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: C.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  progressContainer: {
    position: "absolute",
    bottom: 60,
    left: 40,
    right: 40,
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(45,106,79,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
});
