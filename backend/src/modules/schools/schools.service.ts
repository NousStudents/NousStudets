import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateSchoolDto, UpdateSchoolDto } from './dto';

@Injectable()
export class SchoolsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a new school
     */
    async create(dto: CreateSchoolDto) {
        // Check if subdomain is unique
        if (dto.subdomain) {
            const existingSchool = await this.prisma.school.findUnique({
                where: { subdomain: dto.subdomain },
            });

            if (existingSchool) {
                throw new ConflictException('Subdomain already in use');
            }
        }

        return this.prisma.school.create({
            data: dto,
        });
    }

    /**
     * Find all schools (Super Admin only)
     */
    async findAll() {
        return this.prisma.school.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        classes: true,
                    },
                },
            },
        });
    }

    /**
     * Find a school by ID
     */
    async findOne(schoolId: string) {
        const school = await this.prisma.school.findUnique({
            where: { schoolId },
            include: {
                _count: {
                    select: {
                        users: true,
                        classes: true,
                        exams: true,
                        events: true,
                    },
                },
            },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        return school;
    }

    /**
     * Find a school by subdomain
     */
    async findBySubdomain(subdomain: string) {
        const school = await this.prisma.school.findUnique({
            where: { subdomain },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        return school;
    }

    /**
     * Update a school
     */
    async update(schoolId: string, dto: UpdateSchoolDto) {
        const school = await this.prisma.school.findUnique({
            where: { schoolId },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        // Check if new subdomain is unique
        if (dto.subdomain && dto.subdomain !== school.subdomain) {
            const existingSchool = await this.prisma.school.findUnique({
                where: { subdomain: dto.subdomain },
            });

            if (existingSchool) {
                throw new ConflictException('Subdomain already in use');
            }
        }

        return this.prisma.school.update({
            where: { schoolId },
            data: dto,
        });
    }

    /**
     * Delete a school
     */
    async remove(schoolId: string) {
        const school = await this.prisma.school.findUnique({
            where: { schoolId },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        await this.prisma.school.delete({
            where: { schoolId },
        });

        return { message: 'School deleted successfully' };
    }

    /**
     * Get school statistics
     */
    async getStats(schoolId: string) {
        const school = await this.prisma.school.findUnique({
            where: { schoolId },
        });

        if (!school) {
            throw new NotFoundException('School not found');
        }

        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalClasses,
            totalSubjects,
        ] = await Promise.all([
            this.prisma.user.count({ where: { schoolId } }),
            this.prisma.student.count({ where: { user: { schoolId } } }),
            this.prisma.teacher.count({ where: { user: { schoolId } } }),
            this.prisma.class.count({ where: { schoolId } }),
            this.prisma.subject.count({ where: { class: { schoolId } } }),
        ]);

        return {
            school,
            stats: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalClasses,
                totalSubjects,
            },
        };
    }
}
