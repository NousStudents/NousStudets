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
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from './dto/class.dto';

interface AuthenticatedUser {
    authUserId: string;
    role: string;
    schoolId: string;
    profile: any;
}

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    /**
     * GET /classes
     * Admin/Teacher: View all classes in school
     */
    @Get()
    @Roles('super_admin', 'admin', 'teacher')
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: ClassQueryDto,
    ) {
        return this.classesService.findAll(user.schoolId, query);
    }

    /**
     * GET /classes/my-classes
     * Teacher: View classes they teach
     */
    @Get('my-classes')
    @Roles('teacher')
    async getMyClasses(@CurrentUser() user: AuthenticatedUser) {
        return this.classesService.getTeacherClasses(user.authUserId, user.schoolId);
    }

    /**
     * GET /classes/:id
     * Admin/Teacher: View class details
     */
    @Get(':id')
    @Roles('super_admin', 'admin', 'teacher')
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.classesService.findOne(id, user.schoolId);
    }

    /**
     * GET /classes/:id/stats
     * Admin/Teacher: View class statistics
     */
    @Get(':id/stats')
    @Roles('super_admin', 'admin', 'teacher')
    async getClassStats(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.classesService.getClassStats(id, user.schoolId);
    }

    /**
     * POST /classes
     * Admin: Create a new class
     */
    @Post()
    @Roles('super_admin', 'admin')
    async create(
        @Body() dto: CreateClassDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.classesService.create(dto, user.schoolId);
    }

    /**
     * PUT /classes/:id
     * Admin: Update class details
     */
    @Put(':id')
    @Roles('super_admin', 'admin')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateClassDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.classesService.update(id, dto, user.schoolId);
    }

    /**
     * DELETE /classes/:id
     * Admin: Soft delete a class (only if empty)
     */
    @Delete(':id')
    @Roles('super_admin', 'admin')
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.classesService.remove(id, user.schoolId);
    }
}
