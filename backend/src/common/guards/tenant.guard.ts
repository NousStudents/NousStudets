import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard to ensure user can only access data from their own school (tenant)
 * Works in conjunction with @SchoolId() decorator on routes
 */
@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.schoolId) {
            throw new ForbiddenException('Access denied: User not associated with a school');
        }

        // Check if the request has a schoolId parameter and if it matches user's school
        const requestSchoolId =
            request.params?.schoolId ||
            request.query?.schoolId ||
            request.body?.schoolId;

        if (requestSchoolId && requestSchoolId !== user.schoolId) {
            throw new ForbiddenException('Access denied: Cannot access data from another school');
        }

        // Attach schoolId to request for easy access in controllers
        request.schoolId = user.schoolId;

        return true;
    }
}
