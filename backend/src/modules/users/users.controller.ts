import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard, TenantGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import type { Role } from '../../common/types/role.type';
import { VALID_ROLES } from '../../common/types/role.type';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get current user's profile
     * GET /users/me
     * Returns the logged-in user's data with role-specific profile
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@CurrentUser() currentUser: any) {
        return this.usersService.getFullProfile(currentUser.authUserId);
    }

    /**
     * Get all users with filtering (Admin only)
     * GET /users
     */
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @Roles('admin')
    async findAll(
        @CurrentUser('schoolId') schoolId: string,
        @Query() query: UserQueryDto,
    ) {
        return this.usersService.findAll(schoolId, query);
    }

    /**
     * Get users by role
     * GET /users/role/:role
     */
    @Get('role/:role')
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @Roles('admin', 'teacher')
    async findByRole(
        @CurrentUser('schoolId') schoolId: string,
        @Param('role') role: Role,
    ) {
        return this.usersService.findByRole(schoolId, role);
    }

    /**
     * Resolve roleId to authUserId
     * GET /users/resolve/:role/:roleId
     * Use this to convert role-specific IDs (studentId, teacherId, etc.) to authUserId
     * NOTE: This route must be defined BEFORE :id route to be reachable
     */
    @Get('resolve/:role/:roleId')
    @UseGuards(JwtAuthGuard, TenantGuard)
    async resolveRoleId(
        @Param('role') role: string,
        @Param('roleId') roleId: string,
        @CurrentUser('schoolId') schoolId: string,
    ) {
        if (!VALID_ROLES.includes(role as Role)) {
            throw new ForbiddenException(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
        }
        return this.usersService.resolveRoleId(role as Role, roleId, schoolId);
    }

    /**
     * Get a single user by authUserId
     * GET /users/:id
     * NOTE: :id must be authUserId, not roleId (studentId/teacherId)
     *       Use /users/resolve/:role/:roleId to convert roleId to authUserId
     * Admin can view any user; users can view themselves
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard, TenantGuard)
    async findOne(
        @Param('id') authUserId: string,
        @CurrentUser() currentUser: any,
    ) {
        // Users can view their own profile, admins can view all in tenant
        const isSelf = currentUser.authUserId === authUserId;
        const isAdmin = currentUser.role === 'admin';

        if (!isSelf && !isAdmin) {
            throw new ForbiddenException('You can only view your own profile');
        }

        return this.usersService.getFullProfile(authUserId);
    }

    /**
     * Create a new user (Admin only)
     * POST /users
     * Creates user in role-specific table + reference users table
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateUserDto,
        @CurrentUser('schoolId') schoolId: string,
        @CurrentUser('authUserId') createdBy: string,
    ) {
        // Enforce tenant scoping - use admin's schoolId
        return this.usersService.create({ ...dto, schoolId }, createdBy);
    }

    /**
     * Update a user
     * PUT /users/:id
     * Admin can update any user; users can update themselves
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, TenantGuard)
    async update(
        @Param('id') authUserId: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() currentUser: any,
    ) {
        const isSelf = currentUser.authUserId === authUserId;
        const isAdmin = currentUser.role === 'admin';

        if (!isSelf && !isAdmin) {
            throw new ForbiddenException('You can only update your own profile');
        }

        return this.usersService.update(authUserId, dto);
    }

    /**
     * Delete a user (Admin only)
     * DELETE /users/:id
     * Soft-deletes by setting status to 'inactive'
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id') authUserId: string,
        @CurrentUser('schoolId') schoolId: string,
    ) {
        return this.usersService.remove(authUserId, schoolId);
    }
}
