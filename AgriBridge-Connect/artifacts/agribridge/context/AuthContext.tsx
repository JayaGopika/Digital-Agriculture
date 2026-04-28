import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "/api";

export type UserRole = "farmer" | "customer" | "storage_manager" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  location?: string;
  farmName?: string;
  bio?: string;
  profileImage?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  farmName?: string;
  location?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem("agribridge_token");
      const storedUser = await AsyncStorage.getItem("agribridge_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load auth", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch(`http://localhost:8080/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Login failed");
    }
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    await AsyncStorage.setItem("agribridge_token", data.token);
    await AsyncStorage.setItem("agribridge_user", JSON.stringify(data.user));
  }

  async function register(registerData: RegisterData) {
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Registration failed");
    }
    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    await AsyncStorage.setItem("agribridge_token", data.token);
    await AsyncStorage.setItem("agribridge_user", JSON.stringify(data.user));
  }

  async function logout() {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("agribridge_token");
    await AsyncStorage.removeItem("agribridge_user");
  }

  function updateUser(updates: Partial<User>) {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      AsyncStorage.setItem("agribridge_user", JSON.stringify(updated));
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
