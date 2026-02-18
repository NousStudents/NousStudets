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
    ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherQueryDto, AssignClassDto } from './dto/teacher.dto';

interface AuthenticatedUser {
    authUserId: string;
    role: string;
    schoolId: string;
    profile: any;
}

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    /**
     * GET /teachers
     * Admin: View all teachers in school
     */
    @Get()
    @Roles('super_admin', 'admin')
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: TeacherQueryDto,
    ) {
        return this.teachersService.findAll(user.schoolId, query);
    }

    /**
     * GET /teachers/me
     * Teacher: View their own profile
     */
    @Get('me')
    @Roles('teacher')
    async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
        return this.teachersService.getByAuthUserId(user.authUserId);
    }

    /**
     * GET /teachers/:id
     * Admin: View any teacher in school
     * Teacher: View only themselves
     */
    @Get(':id')
    @Roles('super_admin', 'admin', 'teacher')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teachersService.findOne(id, user.schoolId, user.role, user.authUserId);
    }

    /**
     * POST /teachers
     * Admin: Create a new teacher
     */
    @Post()
    @Roles('super_admin', 'admin')
    async create(
        @Body() dto: CreateTeacherDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teachersService.create(dto, user.schoolId);
    }

    /**
     * PUT /teachers/:id
     * Admin: Update any teacher in school
     * Teacher: Update limited fields of their own profile
     */
    @Put(':id')
    @Roles('super_admin', 'admin', 'teacher')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTeacherDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teachersService.update(
            id,
            dto,
            user.schoolId,
            user.role,
            user.authUserId,
        );
    }

    /**
     * DELETE /teachers/:id
     * Admin only: Soft delete a teacher
     */
    @Delete(':id')
    @Roles('super_admin', 'admin')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teachersService.remove(id, user.schoolId);
    }

    /**
     * POST /teachers/:id/assign-classes
     * Admin: Assign classes to a teacher
     */
    @Post(':id/assign-classes')
    @Roles('super_admin', 'admin')
    async assignClasses(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AssignClassDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.teachersService.assignClasses(id, dto.classIds, user.schoolId);
    }
}
