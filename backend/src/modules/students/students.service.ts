import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Find all students with optional filtering
     * Admin/Teacher can view all students in their school
     * Parents can only view their own children
     * Defaults to active students only
     */
    async findAll(
        schoolId: string,
        query: StudentQueryDto,
        userRole: string,
        authUserId: string,
    ) {
        const { classId, status = 'active', search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        // Get class IDs for this school
        const schoolClasses = await this.prisma.class.findMany({
            where: { schoolId },
            select: { classId: true },
        });
        const schoolClassIds = schoolClasses.map(c => c.classId);

        // Build where clause - students don't have schoolId directly, so filter by class
        // Default to non-inactive status
        const where: any = {
            classId: { in: schoolClassIds },
            status: status === 'all' ? undefined : { not: 'inactive' },
        };

        if (classId) {
            where.classId = classId;
        }

        // If specific status requested (not 'all'), apply it
        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { rollNo: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Parents can only see their linked students
        if (userRole === 'parent') {
            const parent = await this.prisma.parent.findFirst({
                where: { authUserId },
            });
            if (!parent) {
                return { data: [], total: 0, page, limit };
            }
            where.parentId = parent.parentId;
        }

        const [students, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take: limit,
                include: {
                    class: {
                        select: { classId: true, className: true, section: true },
                    },
                    parent: {
                        select: { parentId: true, fullName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.student.count({ where }),
        ]);

        return {
            data: students,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find a single student by ID
     */
    async findOne(id: string, schoolId: string, userRole: string, authUserId: string) {
        const student = await this.prisma.student.findFirst({
            where: {
                studentId: id,
            },
            include: {
                class: true,
                parent: {
                    select: { parentId: true, fullName: true, email: true, phone: true },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // Verify student belongs to a class in this school
        if (student.classId) {
            const studentClass = await this.prisma.class.findFirst({
                where: { classId: student.classId, schoolId },
            });
            if (!studentClass) {
                throw new NotFoundException('Student not found in this school');
            }
        }

        // Parents can only view their own children
        if (userRole === 'parent') {
            const parent = await this.prisma.parent.findFirst({
                where: { authUserId },
            });
            if (!parent || student.parentId !== parent.parentId) {
                throw new ForbiddenException('You can only view your own children');
            }
        }

        // Students can only view themselves
        if (userRole === 'student') {
            const studentProfile = await this.prisma.student.findFirst({
                where: { authUserId },
            });
            if (!studentProfile || studentProfile.studentId !== id) {
                throw new ForbiddenException('You can only view your own profile');
            }
        }

        return student;
    }

    /**
     * Create a new student
     * Only admin/teacher can create students
     */
    async create(dto: CreateStudentDto, schoolId: string) {
        const authUserId = randomUUID();

        // Verify classId belongs to this school if provided
        if (dto.classId) {
            const studentClass = await this.prisma.class.findFirst({
                where: { classId: dto.classId, schoolId },
            });
            if (!studentClass) {
                throw new NotFoundException('Class not found in this school');
            }
        }

        // Create student in the student table
        const student = await this.prisma.student.create({
            data: {
                authUserId,
                email: dto.email,
                fullName: dto.fullName,
                phone: dto.phone,
                classId: dto.classId,
                rollNo: dto.rollNumber,
                status: 'active',
            },
            include: {
                class: {
                    select: { classId: true, className: true, section: true },
                },
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
                role: 'student',
            },
        });

        return student;
    }

    /**
     * Update a student
     * Admin/Teacher can update any student in their school
     * Students can update limited fields of their own profile
     */
    async update(
        id: string,
        dto: UpdateStudentDto,
        schoolId: string,
        userRole: string,
        authUserId: string,
    ) {
        // Check if student exists
        const existing = await this.prisma.student.findFirst({
            where: { studentId: id },
        });

        if (!existing) {
            throw new NotFoundException('Student not found');
        }

        // Students can only update their own profile
        if (userRole === 'student') {
            const studentProfile = await this.prisma.student.findFirst({
                where: { authUserId },
            });
            if (!studentProfile || studentProfile.studentId !== id) {
                throw new ForbiddenException('You can only update your own profile');
            }
            // Students can only update phone
            const allowedFields = ['phone'];
            const updateData: any = {};
            for (const field of allowedFields) {
                if ((dto as any)[field] !== undefined) {
                    updateData[field] = (dto as any)[field];
                }
            }
            return this.prisma.student.update({
                where: { studentId: id },
                data: updateData,
            });
        }

        // Verify classId belongs to this school if being updated
        if (dto.classId) {
            const studentClass = await this.prisma.class.findFirst({
                where: { classId: dto.classId, schoolId },
            });
            if (!studentClass) {
                throw new NotFoundException('Class not found in this school');
            }
        }

        // Admin/Teacher can update all fields
        const student = await this.prisma.student.update({
            where: { studentId: id },
            data: {
                fullName: dto.fullName,
                phone: dto.phone,
                classId: dto.classId,
                rollNo: dto.rollNumber,
                status: dto.status,
            },
            include: {
                class: {
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

        return student;
    }

    /**
     * Soft delete a student (set status to inactive)
     * Only admin can delete students
     */
    async remove(id: string, schoolId: string) {
        const existing = await this.prisma.student.findFirst({
            where: { studentId: id, status: { not: 'inactive' } },
            include: { class: true },
        });

        if (!existing) {
            throw new NotFoundException('Student not found');
        }

        // Verify tenant scope: student must belong to a class in this school
        if (existing.classId && existing.class) {
            if (existing.class.schoolId !== schoolId) {
                throw new ForbiddenException('Student does not belong to your school');
            }
        } else {
            // If student has no class, check via users table
            const userRecord = await this.prisma.user.findFirst({
                where: { authUserId: existing.authUserId },
            });
            if (userRecord && userRecord.schoolId !== schoolId) {
                throw new ForbiddenException('Student does not belong to your school');
            }
        }

        // Soft delete - set status to inactive
        await this.prisma.student.update({
            where: { studentId: id },
            data: { status: 'inactive' },
        });

        // Also update users table status
        await this.prisma.user.updateMany({
            where: { authUserId: existing.authUserId },
            data: { status: 'inactive' },
        });

        return { message: 'Student deleted successfully' };
    }

    /**
     * Link a student to a parent
     */
    async linkToParent(studentId: string, parentId: string, schoolId: string) {
        const student = await this.prisma.student.findFirst({
            where: { studentId },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        const parent = await this.prisma.parent.findFirst({
            where: { parentId, schoolId },
        });

        if (!parent) {
            throw new NotFoundException('Parent not found');
        }

        return this.prisma.student.update({
            where: { studentId },
            data: { parentId },
            include: {
                parent: {
                    select: { parentId: true, fullName: true, email: true },
                },
            },
        });
    }

    /**
     * Get student by auth user ID (for profile)
     */
    async getByAuthUserId(authUserId: string) {
        return this.prisma.student.findFirst({
            where: { authUserId },
            include: {
                class: true,
                parent: {
                    select: { parentId: true, fullName: true },
                },
            },
        });
    }
}
