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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, AssignRoleDto, RemoveRoleDto } from './dto';
import { JwtAuthGuard, RolesGuard, TenantGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { AppRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Create a new user (Admin only)
     * POST /users
     */
    @Post()
    @Roles(AppRole.admin)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateUserDto,
        @CurrentUser('userId') currentUserId: string,
    ) {
        return this.usersService.create(dto, currentUserId);
    }

    /**
     * Get all users with filtering (Admin only)
     * GET /users
     */
    @Get()
    @Roles(AppRole.admin)
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
    @Roles(AppRole.admin, AppRole.teacher)
    async findByRole(
        @CurrentUser('schoolId') schoolId: string,
        @Param('role') role: AppRole,
    ) {
        return this.usersService.findByRole(schoolId, role);
    }

    /**
     * Get a single user
     * GET /users/:id
     */
    @Get(':id')
    async findOne(
        @Param('id') userId: string,
        @CurrentUser() currentUser: any,
    ) {
        // Users can view their own profile, admins can view all
        if (currentUser.userId !== userId && !currentUser.roles.includes(AppRole.admin)) {
            return this.usersService.findOne(currentUser.userId);
        }
        return this.usersService.findOne(userId);
    }

    /**
     * Update a user
     * PUT /users/:id
     */
    @Put(':id')
    async update(
        @Param('id') userId: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() currentUser: any,
    ) {
        // Users can update their own profile, admins can update all
        if (currentUser.userId !== userId && !currentUser.roles.includes(AppRole.admin)) {
            return this.usersService.update(currentUser.userId, dto);
        }
        return this.usersService.update(userId, dto);
    }

    /**
     * Delete a user (Admin only)
     * DELETE /users/:id
     */
    @Delete(':id')
    @Roles(AppRole.admin)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') userId: string) {
        return this.usersService.remove(userId);
    }

    /**
     * Assign a role to a user (Admin only)
     * POST /users/assign-role
     */
    @Post('assign-role')
    @Roles(AppRole.admin)
    async assignRole(
        @Body() dto: AssignRoleDto,
        @CurrentUser('userId') currentUserId: string,
    ) {
        return this.usersService.assignRole(dto, currentUserId);
    }

    /**
     * Remove a role from a user (Admin only)
     * POST /users/remove-role
     */
    @Post('remove-role')
    @Roles(AppRole.admin)
    async removeRole(@Body() dto: RemoveRoleDto) {
        return this.usersService.removeRole(dto);
    }
}
