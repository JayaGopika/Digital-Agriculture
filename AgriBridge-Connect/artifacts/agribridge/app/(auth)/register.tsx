import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAuth, UserRole } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.light;

const roles: { id: UserRole; label: string; icon: string; color: string; desc: string }[] = [
  { id: "farmer", label: "Farmer", icon: "eco", color: C.farmerBadge, desc: "Sell your farm produce" },
  { id: "customer", label: "Customer", icon: "shopping-cart", color: C.customerBadge, desc: "Buy fresh produce" },
  { id: "storage_manager", label: "Storage Manager", icon: "warehouse", color: C.managerBadge, desc: "Manage cold storage" },
  { id: "admin", label: "Admin", icon: "admin-panel-settings", color: C.adminBadge, desc: "Platform management" },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [farmName, setFarmName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role: selectedRole,
        farmName: selectedRole === "farmer" ? farmName.trim() : undefined,
        location: location.trim() || undefined,
      });
    } catch (e: unknown) {
      const err = e as Error;
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the AgriBridge community</Text>
        </View>

        <Text style={styles.sectionTitle}>I am a...</Text>
        <View style={styles.roleContainer}>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && { borderColor: role.color, backgroundColor: `${role.color}10` },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View style={[styles.roleIcon, { backgroundColor: `${role.color}18` }]}>
                <MaterialIcons name={role.icon as any} size={22} color={role.color} />
              </View>
              <Text style={[styles.roleLabel, selectedRole === role.id && { color: role.color }]}>
                {role.label}
              </Text>
              <Text style={styles.roleDesc}>{role.desc}</Text>
              {selectedRole === role.id && (
                <View style={[styles.roleCheck, { backgroundColor: role.color }]}>
                  <Feather name="check" size={11} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Your Details</Text>
        <View style={styles.form}>
          <InputField
            icon="user"
            placeholder="Full Name *"
            value={name}
            onChangeText={setName}
          />
          <InputField
            icon="mail"
            placeholder="Email Address *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            icon="phone"
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color={C.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password * (min 6 chars)"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={C.textMuted} />
            </Pressable>
          </View>

          {selectedRole === "farmer" && (
            <InputField
              icon="home"
              placeholder="Farm Name"
              value={farmName}
              onChangeText={setFarmName}
            />
          )}

          <InputField
            icon="map-pin"
            placeholder="Location / Village"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.registerBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerBtnText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <Text style={[styles.loginLinkText, { color: C.primary, fontFamily: "Inter_600SemiBold" }]}>
            Sign In
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Feather name={icon as any} size={18} color={C.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "words"}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  roleCard: {
    width: "47%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 6,
    position: "relative",
  },
  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: C.text,
    textAlign: "center",
  },
  roleDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: 12,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  eyeBtn: {
    padding: 4,
  },
  registerBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
});
