import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import type { Role } from '../../common/types/role.type';

/**
 * Users Service
 * 
 * Handles all user operations. In the new schema:
 * - Role is determined by which table (admins/teachers/students/parents) has the auth_user_id
 * - The 'users' table is a reference table for general queries
 * - Role-specific tables store the actual profile data
 */
@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get full user profile by auth_user_id
     * Checks all role tables to find the user and returns complete profile
     */
    async getFullProfile(authUserId: string) {
        // Check each role table in priority order
        const admin = await this.prisma.admin.findFirst({
            where: { authUserId },
            include: { school: true },
        });
        if (admin && admin.status === 'active') {
            return this.formatProfile(admin, 'admin');
        }

        const teacher = await this.prisma.teacher.findFirst({
            where: { authUserId },
            include: { school: true },
        });
        if (teacher && teacher.status === 'active') {
            return this.formatProfile(teacher, 'teacher');
        }

        const student = await this.prisma.student.findFirst({
            where: { authUserId },
            include: {
                class: { include: { school: true } },
                parent: true,
            },
        });
        if (student && student.status === 'active') {
            const schoolId = student.class?.school?.schoolId || null;
            return this.formatProfile({ ...student, schoolId, school: student.class?.school }, 'student');
        }

        const parent = await this.prisma.parent.findFirst({
            where: { authUserId },
            include: {
                school: true,
                children: true,
            },
        });
        if (parent && parent.status === 'active') {
            return this.formatProfile(parent, 'parent');
        }

        throw new NotFoundException('User not found or inactive');
    }

    /**
     * Find all users in a school (from role-specific tables)
     * REQUIRES role filter for accurate pagination
     */
    async findAll(schoolId: string, query: UserQueryDto) {
        const { role, status = 'active', search, page = 1, limit = 20 } = query;

        // Require role filter for accurate pagination
        if (!role) {
            throw new BadRequestException(
                'Role filter is required for pagination. Use /users?role=admin|teacher|student|parent or /users/role/:role'
            );
        }

        return this.findByRole(schoolId, role, { search, skip: (page - 1) * limit, limit, status });
    }

    /**
     * Find users by specific role with proper pagination
     */
    async findByRole(schoolId: string, role: Role, options?: { search?: string; skip?: number; limit?: number; status?: string }) {
        const { search, skip = 0, limit = 20, status = 'active' } = options || {};
        const where = this.buildWhere(schoolId, status, search);

        let data: any[] = [];
        let total = 0;

        switch (role) {
            case 'admin':
                [data, total] = await Promise.all([
                    this.prisma.admin.findMany({
                        where,
                        include: { school: true },
                        skip,
                        take: limit,
                    }),
                    this.prisma.admin.count({ where }),
                ]);
                data = data.map(u => this.formatProfile(u, 'admin'));
                break;

            case 'teacher':
                [data, total] = await Promise.all([
                    this.prisma.teacher.findMany({
                        where,
                        include: { school: true },
                        skip,
                        take: limit,
                    }),
                    this.prisma.teacher.count({ where }),
                ]);
                data = data.map(u => this.formatProfile(u, 'teacher'));
                break;

            case 'student':
                const studentWhere = {
                    status: status || undefined,
                    class: { schoolId },
                    ...(search && {
                        OR: [
                            { fullName: { contains: search, mode: 'insensitive' as const } },
                            { email: { contains: search, mode: 'insensitive' as const } },
                        ],
                    }),
                };
                [data, total] = await Promise.all([
                    this.prisma.student.findMany({
                        where: studentWhere,
                        include: { class: { include: { school: true } } },
                        skip,
                        take: limit,
                    }),
                    this.prisma.student.count({ where: studentWhere }),
                ]);
                data = data.map(u => this.formatProfile({ ...u, schoolId, school: u.class?.school }, 'student'));
                break;

            case 'parent':
                [data, total] = await Promise.all([
                    this.prisma.parent.findMany({
                        where,
                        include: { school: true },
                        skip,
                        take: limit,
                    }),
                    this.prisma.parent.count({ where }),
                ]);
                data = data.map(u => this.formatProfile(u, 'parent'));
                break;

            default:
                return { data: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
        }

        const page = Math.floor(skip / limit) + 1;
        return {
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Resolve role-specific ID to authUserId
     * Useful for frontend that has studentId/teacherId but needs authUserId
     */
    async resolveRoleId(role: Role, roleId: string, schoolId: string): Promise<{ authUserId: string; role: Role }> {
        let authUserId: string | null = null;

        switch (role) {
            case 'admin':
                const admin = await this.prisma.admin.findFirst({
                    where: { adminId: roleId, schoolId },
                    select: { authUserId: true },
                });
                authUserId = admin?.authUserId || null;
                break;

            case 'teacher':
                const teacher = await this.prisma.teacher.findFirst({
                    where: { teacherId: roleId, schoolId },
                    select: { authUserId: true },
                });
                authUserId = teacher?.authUserId || null;
                break;

            case 'student':
                const student = await this.prisma.student.findFirst({
                    where: { studentId: roleId },
                    include: { class: true },
                });
                // Verify student belongs to school via class
                if (student && student.class?.schoolId === schoolId) {
                    authUserId = student.authUserId;
                }
                break;

            case 'parent':
                const parent = await this.prisma.parent.findFirst({
                    where: { parentId: roleId, schoolId },
                    select: { authUserId: true },
                });
                authUserId = parent?.authUserId || null;
                break;
        }

        if (!authUserId) {
            throw new NotFoundException(`${role} with ID ${roleId} not found in this school`);
        }

        return { authUserId, role };
    }

    /**
     * Create a new user (Admin only)
     * Creates record in role-specific table + reference users table
     */
    async create(dto: CreateUserDto & { schoolId: string }, createdBy: string) {
        const authUserId = crypto.randomUUID();
        const { role, schoolId, fullName, email, phone } = dto;

        // Create role-specific record
        let profile: any;
        switch (role) {
            case 'admin':
                profile = await this.prisma.admin.create({
                    data: {
                        authUserId,
                        schoolId,
                        fullName,
                        email,
                        phone,
                        status: 'active',
                    },
                    include: { school: true },
                });
                break;

            case 'teacher':
                profile = await this.prisma.teacher.create({
                    data: {
                        authUserId,
                        schoolId,
                        fullName,
                        email,
                        phone,
                        status: 'active',
                    },
                    include: { school: true },
                });
                break;

            case 'student':
                profile = await this.prisma.student.create({
                    data: {
                        authUserId,
                        fullName,
                        email,
                        phone,
                        classId: dto.classId,
                        status: 'active',
                    },
                    include: { class: { include: { school: true } } },
                });
                break;

            case 'parent':
                profile = await this.prisma.parent.create({
                    data: {
                        authUserId,
                        schoolId,
                        fullName,
                        email,
                        phone,
                        status: 'active',
                    },
                    include: { school: true },
                });
                break;

            default:
                throw new BadRequestException(`Invalid role: ${role}`);
        }

        // Create reference record in users table
        await this.prisma.user.create({
            data: {
                authUserId,
                schoolId,
                fullName,
                email,
                phone,
                role,
                status: 'active',
            },
        });

        return this.formatProfile(profile, role);
    }

    /**
     * Update user profile
     */
    async update(authUserId: string, dto: UpdateUserDto) {
        // Find which table the user is in
        const roleData = await this.findUserRole(authUserId);
        if (!roleData) {
            throw new NotFoundException('User not found');
        }

        const { role, profile } = roleData;
        const updateData = {
            fullName: dto.fullName,
            phone: dto.phone,
            status: dto.status,
        };

        let updated: any;
        switch (role) {
            case 'admin':
                updated = await this.prisma.admin.update({
                    where: { adminId: profile.adminId },
                    data: updateData,
                    include: { school: true },
                });
                break;
            case 'teacher':
                updated = await this.prisma.teacher.update({
                    where: { teacherId: profile.teacherId },
                    data: updateData,
                    include: { school: true },
                });
                break;
            case 'student':
                updated = await this.prisma.student.update({
                    where: { studentId: profile.studentId },
                    data: updateData,
                    include: { class: { include: { school: true } } },
                });
                break;
            case 'parent':
                updated = await this.prisma.parent.update({
                    where: { parentId: profile.parentId },
                    data: updateData,
                    include: { school: true },
                });
                break;
        }

        // Also update reference table
        await this.prisma.user.updateMany({
            where: { authUserId },
            data: updateData,
        });

        return this.formatProfile(updated, role);
    }

    /**
     * Soft-delete user by setting status to inactive
     */
    async remove(authUserId: string, schoolId: string) {
        const roleData = await this.findUserRole(authUserId);
        if (!roleData) {
            throw new NotFoundException('User not found');
        }

        const { role, profile } = roleData;

        // Verify tenant scope - students need special handling via class
        if (role === 'student') {
            const student = await this.prisma.student.findFirst({
                where: { studentId: profile.studentId },
                include: { class: true },
            });

            const schoolMatch =
                student?.class?.schoolId === schoolId ||
                (await this.prisma.user.findFirst({
                    where: { authUserId },
                    select: { schoolId: true },
                }))?.schoolId === schoolId;

            if (!schoolMatch) {
                throw new ForbiddenException('User does not belong to your school');
            }
        } else if (profile.schoolId && profile.schoolId !== schoolId) {
            throw new ForbiddenException('User does not belong to your school');
        }

        switch (role) {
            case 'admin':
                await this.prisma.admin.update({
                    where: { adminId: profile.adminId },
                    data: { status: 'inactive' },
                });
                break;
            case 'teacher':
                await this.prisma.teacher.update({
                    where: { teacherId: profile.teacherId },
                    data: { status: 'inactive' },
                });
                break;
            case 'student':
                await this.prisma.student.update({
                    where: { studentId: profile.studentId },
                    data: { status: 'inactive' },
                });
                break;
            case 'parent':
                await this.prisma.parent.update({
                    where: { parentId: profile.parentId },
                    data: { status: 'inactive' },
                });
                break;
        }

        // Update reference table
        await this.prisma.user.updateMany({
            where: { authUserId },
            data: { status: 'inactive' },
        });

        return { message: 'User deactivated successfully' };
    }

    /**
     * Find which role table a user is in
     */
    private async findUserRole(authUserId: string): Promise<{ role: Role; profile: any } | null> {
        const admin = await this.prisma.admin.findFirst({ where: { authUserId } });
        if (admin) return { role: 'admin', profile: admin };

        const teacher = await this.prisma.teacher.findFirst({ where: { authUserId } });
        if (teacher) return { role: 'teacher', profile: teacher };

        const student = await this.prisma.student.findFirst({ where: { authUserId } });
        if (student) return { role: 'student', profile: student };

        const parent = await this.prisma.parent.findFirst({ where: { authUserId } });
        if (parent) return { role: 'parent', profile: parent };

        return null;
    }

    /**
     * Build Prisma where clause for role table queries
     */
    private buildWhere(schoolId: string, status?: string, search?: string) {
        return {
            schoolId,
            status: status || undefined,
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };
    }

    /**
     * Format profile for API response
     */
    private formatProfile(profile: any, role: Role) {
        const id = profile.adminId || profile.teacherId || profile.studentId || profile.parentId;
        return {
            id,
            authUserId: profile.authUserId,
            email: profile.email,
            fullName: profile.fullName,
            phone: profile.phone,
            role,
            status: profile.status,
            schoolId: profile.schoolId,
            school: profile.school,
            createdAt: profile.createdAt,
            // Role-specific fields
            ...(role === 'teacher' && {
                qualification: profile.qualification,
                experience: profile.experience,
                subjectSpecialization: profile.subjectSpecialization,
            }),
            ...(role === 'student' && {
                classId: profile.classId,
                class: profile.class,
                rollNo: profile.rollNo,
                section: profile.section,
            }),
            ...(role === 'parent' && {
                relation: profile.relation,
                children: profile.children,
            }),
        };
    }
}
