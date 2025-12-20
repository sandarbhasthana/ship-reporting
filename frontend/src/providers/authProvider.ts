import type { AuthProvider } from "@refinedev/core";

// API base URL - will be configured via environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Auth Provider for Refine
 * Handles JWT-based authentication with the NestJS backend
 * Designed to be extended for OIDC later
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        return {
          success: false,
          error: { name: "LoginError", message: "Invalid credentials" }
        };
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true, redirectTo: "/" };
    } catch (error) {
      return {
        success: false,
        error: { name: "LoginError", message: `Network error: ${error}` }
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return { authenticated: false, redirectTo: "/login" };
    }
    return { authenticated: true };
  },

  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.role?.permissions || [];
    }
    return [];
  },

  getIdentity: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      return {
        id: parsed.id,
        name: parsed.name || parsed.email,
        email: parsed.email,
        avatar: parsed.avatar,
        role: parsed.role,
        organizationId: parsed.organizationId,
        organizationName: parsed.organization?.name,
        assignedVesselId: parsed.assignedVesselId
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  }
};
