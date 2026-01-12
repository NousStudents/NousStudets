import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma';
import { CreateUserDto, UpdateUserDto, UserQueryDto, AssignRoleDto, RemoveRoleDto } from './dto';
import { AppRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Create a new user
     */
    async create(dto: CreateUserDto, grantedBy?: string) {
        // Check if user exists in this school
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                schoolId: dto.schoolId,
            },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists in this school');
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (dto.password) {
            const saltRounds = this.configService.get<number>('bcrypt.saltRounds');
            hashedPassword = await bcrypt.hash(dto.password, saltRounds);
        }

        // Create user with roles
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                fullName: dto.fullName,
                phone: dto.phone,
                schoolId: dto.schoolId,
                mustChangePassword: !!dto.password, // Must change if password was set
                roles: dto.roles?.length
                    ? {
                        create: dto.roles.map((role) => ({
                            role,
                            grantedBy,
                        })),
                    }
                    : undefined,
            },
            include: {
                roles: true,
                school: true,
            },
        });

        return this.formatUser(user);
    }

    /**
     * Find all users with filtering and pagination
     */
    async findAll(schoolId: string, query: UserQueryDto) {
        const { role, status, search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: any = { schoolId };

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.roles = {
                some: { role },
            };
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { roles: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(this.formatUser),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find a single user by ID
     */
    async findOne(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
            include: {
                roles: true,
                school: true,
                teacher: true,
                student: {
                    include: {
                        class: true,
                        parent: { include: { user: true } },
                    },
                },
                parent: {
                    include: {
                        children: { include: { user: true } },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.formatUser(user);
    }

    /**
     * Update a user
     */
    async update(userId: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.prisma.user.update({
            where: { userId },
            data: dto,
            include: { roles: true, school: true },
        });

        return this.formatUser(updatedUser);
    }

    /**
     * Delete a user
     */
    async remove(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({
            where: { userId },
        });

        return { message: 'User deleted successfully' };
    }

    /**
     * Assign a role to a user
     */
    async assignRole(dto: AssignRoleDto, grantedBy: string) {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { userId: dto.userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if role already exists
        const existingRole = await this.prisma.userRole.findUnique({
            where: {
                userId_role: {
                    userId: dto.userId,
                    role: dto.role,
                },
            },
        });

        if (existingRole) {
            throw new ConflictException('User already has this role');
        }

        // Add role
        await this.prisma.userRole.create({
            data: {
                userId: dto.userId,
                role: dto.role,
                grantedBy,
            },
        });

        // If role is teacher, student, or parent, create profile record if not exists
        await this.createProfileRecord(dto.userId, dto.role);

        return this.findOne(dto.userId);
    }

    /**
     * Remove a role from a user
     */
    async removeRole(dto: RemoveRoleDto) {
        const role = await this.prisma.userRole.findUnique({
            where: {
                userId_role: {
                    userId: dto.userId,
                    role: dto.role,
                },
            },
        });

        if (!role) {
            throw new NotFoundException('User does not have this role');
        }

        await this.prisma.userRole.delete({
            where: { id: role.id },
        });

        return this.findOne(dto.userId);
    }

    /**
     * Get users by role within a school
     */
    async findByRole(schoolId: string, role: AppRole) {
        const users = await this.prisma.user.findMany({
            where: {
                schoolId,
                roles: {
                    some: { role },
                },
            },
            include: { roles: true },
        });

        return users.map(this.formatUser);
    }

    /**
     * Create profile record based on role
     */
    private async createProfileRecord(userId: string, role: AppRole) {
        switch (role) {
            case AppRole.teacher:
                const existingTeacher = await this.prisma.teacher.findUnique({
                    where: { userId },
                });
                if (!existingTeacher) {
                    await this.prisma.teacher.create({
                        data: { userId },
                    });
                }
                break;

            case AppRole.student:
                const existingStudent = await this.prisma.student.findUnique({
                    where: { userId },
                });
                if (!existingStudent) {
                    await this.prisma.student.create({
                        data: { userId },
                    });
                }
                break;

            case AppRole.parent:
                const existingParent = await this.prisma.parent.findUnique({
                    where: { userId },
                });
                if (!existingParent) {
                    await this.prisma.parent.create({
                        data: { userId },
                    });
                }
                break;
        }
    }

    /**
     * Format user for response (remove sensitive data)
     */
    private formatUser(user: any) {
        const { password, authUserId, ...userData } = user;
        return {
            ...userData,
            roles: user.roles?.map((r: any) => r.role) || [],
        };
    }
}
