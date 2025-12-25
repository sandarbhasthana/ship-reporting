import type { AccessControlProvider } from "@refinedev/core";

type RoleName = "SUPER_ADMIN" | "ADMIN" | "CAPTAIN";

/**
 * Access Control Provider for Refine
 * Handles role-based access control for resources
 *
 * Role hierarchy:
 * - SUPER_ADMIN: Platform admin, can manage all organizations (not individual vessels)
 * - ADMIN: Organization admin, can manage their organization only
 * - CAPTAIN: Vessel user, can manage their vessel data only
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return { can: false, reason: "Not authenticated" };
    }

    const user = JSON.parse(userStr);
    const role = user.role as RoleName;

    // SUPER_ADMIN specific access
    if (role === "SUPER_ADMIN") {
      // SUPER_ADMIN can access audit logs
      if (resource === "audit-logs") {
        return { can: true };
      }
      // SUPER_ADMIN cannot access vessels directly - they manage at organization level
      if (resource === "vessels") {
        return {
          can: false,
          reason: "Super admins manage vessels through organizations"
        };
      }
      // SUPER_ADMIN cannot access users directly - they manage at organization level
      if (resource === "users") {
        return {
          can: false,
          reason: "Super admins manage users through organizations"
        };
      }
      // SUPER_ADMIN cannot access inspections directly - they manage at organization level
      if (resource === "inspections") {
        return {
          can: false,
          reason: "Super admins manage inspections through organizations"
        };
      }
      // SUPER_ADMIN can access everything else
      return { can: true };
    }

    // Organizations resource is SUPER_ADMIN only
    if (resource === "organizations") {
      return {
        can: false,
        reason: "Only super admins can manage organizations"
      };
    }

    // Users resource is admin-only (ADMIN and SUPER_ADMIN)
    if (resource === "users") {
      if (role === "ADMIN") {
        return { can: true };
      }
      return { can: false, reason: "Only admins can access user management" };
    }

    // Settings resource is admin-only (ADMIN and SUPER_ADMIN)
    if (resource === "settings") {
      if (role === "ADMIN") {
        return { can: true };
      }
      return { can: false, reason: "Only admins can access settings" };
    }

    // Audit logs resource is admin-only (ADMIN and SUPER_ADMIN)
    if (resource === "audit-logs") {
      if (role === "ADMIN") {
        return { can: true };
      }
      return { can: false, reason: "Only admins can access audit logs" };
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
