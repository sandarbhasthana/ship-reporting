import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithOrg extends Request {
  organizationId?: string;
}

/**
 * Decorator to get the current organization ID from the request
 * This is set by the TenantGuard and represents the user's organization context
 *
 * Usage:
 * @Get()
 * async findAll(@OrganizationId() orgId: string) {
 *   return this.service.findAll(orgId);
 * }
 */
export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrg>();
    return request.organizationId || null;
  },
);
