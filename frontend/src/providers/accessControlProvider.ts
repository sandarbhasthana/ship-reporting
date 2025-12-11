import type { AccessControlProvider } from "@refinedev/core";

/**
 * Access Control Provider for Refine
 * Handles role-based access control for resources
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return { can: false, reason: "Not authenticated" };
    }

    const user = JSON.parse(userStr);
    const role = user.role;

    // Users resource is admin-only
    if (resource === "users") {
      if (role === "ADMIN") {
        return { can: true };
      }
      return { can: false, reason: "Only admins can access user management" };
    }

    // Settings resource is admin-only
    if (resource === "settings") {
      if (role === "ADMIN") {
        return { can: true };
      }
      return { can: false, reason: "Only admins can access settings" };
    }

    // All other resources are accessible to all authenticated users
    return { can: true };
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true
    }
  }
};
