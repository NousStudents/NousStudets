import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto, ClassQueryDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Find all classes with optional filtering
     */
    async findAll(schoolId: string, query: ClassQueryDto) {
        const { grade, status, search, academicYear, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            schoolId,
        };

        // Note: The schema doesn't have a 'grade' field, so we'll skip this filter
        // if (grade !== undefined) {
        //     where.grade = grade;
        // }

        if (search) {
            where.OR = [
                { className: { contains: search, mode: 'insensitive' } },
                { section: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [classes, total] = await Promise.all([
            this.prisma.class.findMany({
                where,
                skip,
                take: limit,
                include: {
                    classTeacher: {
                        select: { teacherId: true, fullName: true, email: true },
                    },
                    _count: {
                        select: { students: true },
                    },
                },
                orderBy: [{ className: 'asc' }],
            }),
            this.prisma.class.count({ where }),
        ]);

        return {
            data: classes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Find a single class by ID
     */
    async findOne(id: string, schoolId: string) {
        const classItem = await this.prisma.class.findFirst({
            where: {
                classId: id,
                schoolId,
            },
            include: {
                classTeacher: {
                    select: { teacherId: true, fullName: true, email: true, phone: true },
                },
                students: {
                    select: { studentId: true, fullName: true, email: true, rollNo: true },
                    orderBy: { rollNo: 'asc' },
                },
                school: {
                    select: { schoolId: true, schoolName: true },
                },
            },
        });

        if (!classItem) {
            throw new NotFoundException('Class not found');
        }

        return classItem;
    }

    /**
     * Create a new class
     */
    async create(dto: CreateClassDto, schoolId: string) {
        // Verify class teacher exists if provided
        if (dto.classTeacherId) {
            const teacher = await this.prisma.teacher.findFirst({
                where: { teacherId: dto.classTeacherId, schoolId },
            });
            if (!teacher) {
                throw new NotFoundException('Class teacher not found');
            }
        }

        return this.prisma.class.create({
            data: {
                schoolId,
                className: dto.name,
                section: dto.section,
                classTeacherId: dto.classTeacherId,
            },
            include: {
                classTeacher: {
                    select: { teacherId: true, fullName: true },
                },
            },
        });
    }

    /**
     * Update a class
     */
    async update(id: string, dto: UpdateClassDto, schoolId: string) {
        // Check if class exists
        const existing = await this.prisma.class.findFirst({
            where: { classId: id, schoolId },
        });

        if (!existing) {
            throw new NotFoundException('Class not found');
        }

        // Verify class teacher exists if being updated
        if (dto.classTeacherId) {
            const teacher = await this.prisma.teacher.findFirst({
                where: { teacherId: dto.classTeacherId, schoolId },
            });
            if (!teacher) {
                throw new NotFoundException('Class teacher not found');
            }
        }

        return this.prisma.class.update({
            where: { classId: id },
            data: {
                className: dto.name,
                section: dto.section,
                classTeacherId: dto.classTeacherId,
            },
            include: {
                classTeacher: {
                    select: { teacherId: true, fullName: true },
                },
                _count: {
                    select: { students: true },
                },
            },
        });
    }

    /**
     * Delete a class
     */
    async remove(id: string, schoolId: string) {
        const existing = await this.prisma.class.findFirst({
            where: { classId: id, schoolId },
        });

        if (!existing) {
            throw new NotFoundException('Class not found');
        }

        // Check if class has students
        const studentCount = await this.prisma.student.count({
            where: { classId: id },
        });

        if (studentCount > 0) {
            throw new BadRequestException(
                `Cannot delete class with ${studentCount} active students. Reassign or remove students first.`,
            );
        }

        // Delete the class
        await this.prisma.class.delete({
            where: { classId: id },
        });

        return { message: 'Class deleted successfully' };
    }

    /**
     * Get classes for a teacher
     */
    async getTeacherClasses(authUserId: string, schoolId: string) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { authUserId },
        });

        if (!teacher) {
            throw new NotFoundException('Teacher not found');
        }

        return this.prisma.class.findMany({
            where: {
                schoolId,
                classTeacherId: teacher.teacherId,
            },
            include: {
                _count: {
                    select: { students: true },
                },
            },
            orderBy: [{ className: 'asc' }],
        });
    }

    /**
     * Get class statistics
     */
    async getClassStats(id: string, schoolId: string) {
        const classItem = await this.prisma.class.findFirst({
            where: { classId: id, schoolId },
        });

        if (!classItem) {
            throw new NotFoundException('Class not found');
        }

        const [totalStudents, activeStudents] = await Promise.all([
            this.prisma.student.count({
                where: { classId: id },
            }),
            this.prisma.student.count({
                where: { classId: id, status: 'active' },
            }),
        ]);

        return {
            classId: id,
            className: classItem.className,
            section: classItem.section,
            totalStudents,
            activeStudents,
            inactiveStudents: totalStudents - activeStudents,
        };
    }
}
