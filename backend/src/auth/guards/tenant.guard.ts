import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@ship-reporting/prisma';
import { Request } from 'express';

interface JwtUser {
  sub: string;
  email: string;
  role: RoleName;
  organizationId: string | null;
  assignedVesselId: string | null;
}

interface RequestWithUser extends Request {
  user?: JwtUser;
  organizationId?: string | null;
}

export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * Decorator to skip tenant check for specific routes
 * Use this for routes that don't require organization context (e.g., super admin routes)
 */
export const SkipTenantCheck =
  () =>
  (
    _target: object,
    _key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor?.value) {
      Reflect.defineMetadata(
        SKIP_TENANT_CHECK_KEY,
        true,
        descriptor.value as object,
      );
    }
    return descriptor;
  };

/**
 * TenantGuard ensures organization-level data isolation
 *
 * - SUPER_ADMIN: Can access any organization's data via X-Organization-Id header
 * - ADMIN/CAPTAIN: Must have organizationId in JWT, automatically scoped to their org
 *
 * The organizationId is attached to request.organizationId for use in services
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if this route should skip tenant check
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admins can access any organization with explicit header
    if (user.role === RoleName.SUPER_ADMIN) {
      const targetOrg = request.headers['x-organization-id'];
      // Super admin can operate without org context for platform-wide operations
      request.organizationId = typeof targetOrg === 'string' ? targetOrg : null;
      return true;
    }

    // Regular users (ADMIN, CAPTAIN) must have organizationId
    if (!user.organizationId) {
      throw new ForbiddenException('User not assigned to any organization');
    }

    // Attach organizationId to request for use in services
    request.organizationId = user.organizationId;
    return true;
  }
}
