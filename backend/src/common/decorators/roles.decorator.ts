import { SetMetadata } from '@nestjs/common';
import { AppRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Usage: @Roles(AppRole.admin, AppRole.teacher)
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
