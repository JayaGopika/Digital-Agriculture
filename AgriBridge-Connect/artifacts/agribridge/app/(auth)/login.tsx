import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Image, Dimensions, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");
const C = Colors.light;

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showToast("Please enter email and password", "error");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      setSuccess(true);
      showToast("Login successful! Welcome back 👋", "success");
    } catch (e: unknown) {
      const err = e as Error;
      showToast(err.message || "Login failed. Check your credentials.", "error");
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your AgriBridge account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Your password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                editable={!loading}
              />
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={C.textMuted} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              success && styles.loginBtnSuccess,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading || success}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : success ? (
              <>
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.loginBtnText}>Welcome back!</Text>
              </>
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New to AgriBridge?</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push("/(auth)/register")}
            disabled={loading}
          >
            <Text style={styles.registerBtnText}>Create Account</Text>
          </Pressable>

          <View style={styles.demoHint}>
            <Feather name="info" size={14} color={C.textMuted} />
            <Text style={styles.demoText}>Demo: farmer@test.com · customer@test.com · admin@test.com</Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.footerText}>Connecting farmers, customers & cold storage</Text>
        </View>
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  header: { alignItems: "center", paddingTop: 20, paddingBottom: 36 },
  logo: { width: width * 0.60, height: 100, marginBottom: 16 },
  welcome: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, paddingLeft: 2 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.card,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: C.text },
  eyeBtn: { padding: 4 },
  loginBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 12, height: 54, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginBtnSuccess: { backgroundColor: "#27AE60" },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted },
  registerBtn: {
    backgroundColor: C.paleGreen, borderRadius: 12, height: 54,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.primaryLight,
  },
  registerBtnText: { color: C.primary, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  demoHint: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#F1F8E9", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#DCEDC8",
  },
  demoText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, lineHeight: 15 },
  footer: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingTop: 40 },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
});
