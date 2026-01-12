import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto, UpdateSchoolDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { AppRole } from '@prisma/client';

@Controller('schools')
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) { }

    /**
     * Create a new school (Super Admin only in real implementation)
     * POST /schools
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.admin)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateSchoolDto) {
        return this.schoolsService.create(dto);
    }

    /**
     * Get all schools (Super Admin only)
     * GET /schools
     */
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.admin)
    async findAll() {
        return this.schoolsService.findAll();
    }

    /**
     * Get school by subdomain (Public - for tenant discovery)
     * GET /schools/subdomain/:subdomain
     */
    @Get('subdomain/:subdomain')
    @Public()
    async findBySubdomain(@Param('subdomain') subdomain: string) {
        return this.schoolsService.findBySubdomain(subdomain);
    }

    /**
     * Get current user's school
     * GET /schools/my-school
     */
    @Get('my-school')
    @UseGuards(JwtAuthGuard)
    async getMySchool(@CurrentUser('schoolId') schoolId: string) {
        return this.schoolsService.findOne(schoolId);
    }

    /**
     * Get school statistics
     * GET /schools/stats
     */
    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.admin)
    async getStats(@CurrentUser('schoolId') schoolId: string) {
        return this.schoolsService.getStats(schoolId);
    }

    /**
     * Get a school by ID
     * GET /schools/:id
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') schoolId: string) {
        return this.schoolsService.findOne(schoolId);
    }

    /**
     * Update a school (Admin only)
     * PUT /schools/:id
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.admin)
    async update(
        @Param('id') schoolId: string,
        @Body() dto: UpdateSchoolDto,
    ) {
        return this.schoolsService.update(schoolId, dto);
    }

    /**
     * Delete a school (Super Admin only in real implementation)
     * DELETE /schools/:id
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(AppRole.admin)
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') schoolId: string) {
        return this.schoolsService.remove(schoolId);
    }
}
