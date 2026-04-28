import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export function useApi() {
  const { token } = useAuth();

  async function apiFetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || "Request failed");
    }
    return response.json();
  }

  return { apiFetch };
}
