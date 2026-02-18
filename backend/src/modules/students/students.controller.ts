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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';

interface AuthenticatedUser {
    authUserId: string;
    role: string;
    schoolId: string;
    profile: any;
}

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    /**
     * GET /students
     * Admin/Teacher: View all students in school
     * Parent: View only their children
     */
    @Get()
    @Roles('super_admin', 'admin', 'teacher', 'parent')
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: StudentQueryDto,
    ) {
        return this.studentsService.findAll(
            user.schoolId,
            query,
            user.role,
            user.authUserId,
        );
    }

    /**
     * GET /students/me
     * Student: View their own profile
     */
    @Get('me')
    @Roles('student')
    async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
        return this.studentsService.getByAuthUserId(user.authUserId);
    }

    /**
     * GET /students/:id
     * Admin/Teacher: View any student in school
     * Parent: View only their children
     * Student: View only themselves
     */
    @Get(':id')
    @Roles('super_admin', 'admin', 'teacher', 'parent', 'student')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.studentsService.findOne(
            id,
            user.schoolId,
            user.role,
            user.authUserId,
        );
    }

    /**
     * POST /students
     * Admin/Teacher: Create a new student
     */
    @Post()
    @Roles('super_admin', 'admin', 'teacher')
    async create(
        @Body() dto: CreateStudentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.studentsService.create(dto, user.schoolId);
    }

    /**
     * PUT /students/:id
     * Admin/Teacher: Update any student in school
     * Student: Update limited fields of their own profile
     */
    @Put(':id')
    @Roles('super_admin', 'admin', 'teacher', 'student')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateStudentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.studentsService.update(
            id,
            dto,
            user.schoolId,
            user.role,
            user.authUserId,
        );
    }

    /**
     * DELETE /students/:id
     * Admin only: Soft delete a student
     */
    @Delete(':id')
    @Roles('super_admin', 'admin')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.studentsService.remove(id, user.schoolId);
    }

    /**
     * POST /students/:id/link-parent
     * Admin/Teacher: Link a student to a parent
     */
    @Post(':id/link-parent')
    @Roles('super_admin', 'admin', 'teacher')
    async linkToParent(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('parentId', ParseUUIDPipe) parentId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.studentsService.linkToParent(id, parentId, user.schoolId);
    }
}
