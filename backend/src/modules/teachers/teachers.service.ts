import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, TeacherQueryDto } from './dto/teacher.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TeachersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Find all teachers with optional filtering
     * Defaults to active teachers only
     */
    async findAll(schoolId: string, query: TeacherQueryDto) {
        const { subject, status = 'active', search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        // Build where clause - default to non-inactive
        const where: any = {
            schoolId,
            status: status === 'all' ? undefined : { not: 'inactive' },
        };

        if (subject) {
            where.subjectSpecialization = { contains: subject, mode: 'insensitive' };
        }

        // If specific status requested (not 'all'), apply it
        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [teachers, total] = await Promise.all([
            this.prisma.teacher.findMany({
                where,
                skip,
                take: limit,
                include: {
                    classTeacherOf: {
                        select: { classId: true, className: true, section: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.teacher.count({ where }),
        ]);

        return {
            data: teachers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find a single teacher by ID
     * Admin: can view any teacher in school
     * Teacher: can only view themselves
     */
    async findOne(id: string, schoolId: string, userRole?: string, authUserId?: string) {
        const teacher = await this.prisma.teacher.findFirst({
            where: {
                teacherId: id,
                schoolId,
                status: { not: 'inactive' }, // Exclude soft-deleted
            },
            include: {
                classTeacherOf: {
                    select: { classId: true, className: true, section: true },
                },
                school: {
                    select: { schoolId: true, schoolName: true },
                },
            },
        });

        if (!teacher) {
            throw new NotFoundException('Teacher not found');
        }

        // Teachers can only view their own profile
        if (userRole === 'teacher' && authUserId) {
            if (teacher.authUserId !== authUserId) {
                throw new ForbiddenException('You can only view your own profile');
            }
        }

        return teacher;
    }

    /**
     * Create a new teacher
     */
    async create(dto: CreateTeacherDto, schoolId: string) {
        const authUserId = randomUUID();

        // Create teacher in the teacher table
        const teacher = await this.prisma.teacher.create({
            data: {
                authUserId,
                schoolId,
                email: dto.email,
                fullName: dto.fullName,
                phone: dto.phone,
                subjectSpecialization: dto.subject,
                qualification: dto.qualification,
                status: 'active',
            },
        });

        // Also create entry in users reference table
        await this.prisma.user.create({
            data: {
                authUserId,
                schoolId,
                email: dto.email,
                fullName: dto.fullName,
                phone: dto.phone,
                role: 'teacher',
            },
        });

        return teacher;
    }

    /**
     * Update a teacher
     */
    async update(
        id: string,
        dto: UpdateTeacherDto,
        schoolId: string,
        userRole: string,
        authUserId: string,
    ) {
        // Check if teacher exists
        const existing = await this.prisma.teacher.findFirst({
            where: { teacherId: id, schoolId },
        });

        if (!existing) {
            throw new NotFoundException('Teacher not found');
        }

        // Teachers can only update their own profile
        if (userRole === 'teacher') {
            const teacherProfile = await this.prisma.teacher.findFirst({
                where: { authUserId },
            });
            if (!teacherProfile || teacherProfile.teacherId !== id) {
                throw new ForbiddenException('You can only update your own profile');
            }
            // Teachers can only update phone and qualification
            const allowedFields = ['phone', 'qualification'];
            const updateData: any = {};
            for (const field of allowedFields) {
                if ((dto as any)[field] !== undefined) {
                    updateData[field] = (dto as any)[field];
                }
            }
            return this.prisma.teacher.update({
                where: { teacherId: id },
                data: updateData,
            });
        }

        // Admin can update all fields
        const teacher = await this.prisma.teacher.update({
            where: { teacherId: id },
            data: {
                fullName: dto.fullName,
                phone: dto.phone,
                subjectSpecialization: dto.subject,
                qualification: dto.qualification,
                status: dto.status,
            },
            include: {
                classTeacherOf: {
                    select: { classId: true, className: true, section: true },
                },
            },
        });

        // Sync with users table if name/phone changed
        if (dto.fullName || dto.phone) {
            await this.prisma.user.updateMany({
                where: { authUserId: existing.authUserId },
                data: {
                    ...(dto.fullName && { fullName: dto.fullName }),
                    ...(dto.phone && { phone: dto.phone }),
                },
            });
        }

        return teacher;
    }

    /**
     * Soft delete a teacher (set status to inactive)
     */
    async remove(id: string, schoolId: string) {
        const existing = await this.prisma.teacher.findFirst({
            where: { teacherId: id, schoolId, status: { not: 'inactive' } },
        });

        if (!existing) {
            throw new NotFoundException('Teacher not found');
        }

        // Soft delete - set status to inactive
        await this.prisma.teacher.update({
            where: { teacherId: id },
            data: { status: 'inactive' },
        });

        // Also update users table status
        await this.prisma.user.updateMany({
            where: { authUserId: existing.authUserId },
            data: { status: 'inactive' },
        });

        return { message: 'Teacher deleted successfully' };
    }

    /**
     * Assign classes to a teacher
     */
    async assignClasses(id: string, classIds: string[], schoolId: string) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { teacherId: id, schoolId },
        });

        if (!teacher) {
            throw new NotFoundException('Teacher not found');
        }

        // Verify all classes belong to the same school
        const classes = await this.prisma.class.findMany({
            where: {
                classId: { in: classIds },
                schoolId,
            },
        });

        if (classes.length !== classIds.length) {
            throw new NotFoundException('Some classes were not found');
        }

        // Update classes to set this teacher as class teacher
        await this.prisma.class.updateMany({
            where: { classId: { in: classIds } },
            data: { classTeacherId: id },
        });

        return this.findOne(id, schoolId);
    }

    /**
     * Get teacher by auth user ID (for profile)
     */
    async getByAuthUserId(authUserId: string) {
        return this.prisma.teacher.findFirst({
            where: { authUserId },
            include: {
                classTeacherOf: true,
                school: {
                    select: { schoolId: true, schoolName: true },
                },
            },
        });
    }
}
