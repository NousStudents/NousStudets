import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role.type';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * Usage: @Roles('admin', 'teacher')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
