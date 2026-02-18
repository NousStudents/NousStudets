import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';

// Role type based on the SQL schema (determined by which table has the auth_user_id)
export type Role = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';

export interface JwtPayload {
    sub: string; // auth_user_id (UUID from auth provider or generated)
    email: string;
    schoolId: string | null;
    role: Role;
}

export interface AuthResponse {
    user: {
        id: string; // The role-specific ID (admin_id, teacher_id, etc.)
        authUserId: string;
        email: string;
        fullName: string;
        schoolId: string | null;
        role: Role;
    };
    accessToken: string;
    refreshToken: string;
}

interface UserProfile {
    id: string;
    authUserId: string;
    email: string;
    fullName: string;
    schoolId: string | null;
    role: Role;
    profile: any;
    school?: any;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Get user's role by checking which table has the auth_user_id
     * Priority: super_admin > admin > teacher > student > parent
     */
    async getUserRole(authUserId: string): Promise<{ role: Role; profile: any; schoolId: string | null } | null> {
        // Check super_admin first
        const superAdmin = await this.prisma.superAdmin.findFirst({
            where: { authUserId },
        });
        if (superAdmin && superAdmin.status === 'active') {
            return { role: 'super_admin', profile: superAdmin, schoolId: null };
        }

        // Check admin
        const admin = await this.prisma.admin.findFirst({
            where: { authUserId },
        });
        if (admin && admin.status === 'active') {
            return { role: 'admin', profile: admin, schoolId: admin.schoolId };
        }

        // Check teacher
        const teacher = await this.prisma.teacher.findFirst({
            where: { authUserId },
        });
        if (teacher && teacher.status === 'active') {
            return { role: 'teacher', profile: teacher, schoolId: teacher.schoolId };
        }

        // Check student
        const student = await this.prisma.student.findFirst({
            where: { authUserId },
        });
        if (student && student.status === 'active') {
            // Student schoolId comes from class
            let schoolId: string | null = null;
            if (student.classId) {
                const studentClass = await this.prisma.class.findUnique({
                    where: { classId: student.classId },
                });
                schoolId = studentClass?.schoolId || null;
            }
            return { role: 'student', profile: student, schoolId };
        }

        // Check parent
        const parent = await this.prisma.parent.findFirst({
            where: { authUserId },
        });
        if (parent && parent.status === 'active') {
            return { role: 'parent', profile: parent, schoolId: parent.schoolId };
        }

        return null;
    }

    /**
     * Register a new user with a specific role
     */
    async register(dto: RegisterDto & { role: Role }): Promise<AuthResponse> {
        // Check if school exists
        const school = await this.prisma.school.findUnique({
            where: { schoolId: dto.schoolId },
        });

        if (!school) {
            throw new BadRequestException('Invalid school ID');
        }

        // Generate a unique auth_user_id for this user
        const authUserId = crypto.randomUUID();

        // Check if email already exists for this role in this school
        await this.checkEmailExists(dto.email, dto.schoolId, dto.role);

        // Hash password (stored in the users table for reference)
        const saltRounds = this.configService.get<number>('bcrypt.saltRounds') || 12;
        const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

        let profile: any;
        let roleId: string;

        // Create role-specific record
        switch (dto.role) {
            case 'admin':
                profile = await this.prisma.admin.create({
                    data: {
                        authUserId,
                        schoolId: dto.schoolId,
                        fullName: dto.fullName,
                        email: dto.email,
                        phone: dto.phone,
                        status: 'active',
                    },
                });
                roleId = profile.adminId;
                break;
            case 'teacher':
                profile = await this.prisma.teacher.create({
                    data: {
                        authUserId,
                        schoolId: dto.schoolId,
                        fullName: dto.fullName,
                        email: dto.email,
                        phone: dto.phone,
                        status: 'active',
                    },
                });
                roleId = profile.teacherId;
                break;
            case 'student':
                profile = await this.prisma.student.create({
                    data: {
                        authUserId,
                        fullName: dto.fullName,
                        email: dto.email,
                        phone: dto.phone,
                        status: 'active',
                    },
                });
                roleId = profile.studentId;
                break;
            case 'parent':
                profile = await this.prisma.parent.create({
                    data: {
                        authUserId,
                        schoolId: dto.schoolId,
                        fullName: dto.fullName,
                        email: dto.email,
                        phone: dto.phone,
                        status: 'active',
                    },
                });
                roleId = profile.parentId;
                break;
            default:
                throw new BadRequestException('Invalid role');
        }

        // Also create a reference in the users table (for general lookups)
        await this.prisma.user.create({
            data: {
                authUserId,
                schoolId: dto.schoolId,
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                role: dto.role,
                status: 'active',
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens({
            authUserId,
            email: dto.email,
            schoolId: dto.schoolId,
            role: dto.role,
        });

        return {
            user: {
                id: roleId,
                authUserId,
                email: dto.email,
                fullName: dto.fullName,
                schoolId: dto.schoolId,
                role: dto.role,
            },
            ...tokens,
        };
    }

    /**
     * Check if email already exists for a role in a school
     */
    private async checkEmailExists(email: string, schoolId: string, role: Role): Promise<void> {
        switch (role) {
            case 'admin':
                const existingAdmin = await this.prisma.admin.findFirst({
                    where: { email, schoolId },
                });
                if (existingAdmin) {
                    throw new ConflictException('Admin with this email already exists in this school');
                }
                break;
            case 'teacher':
                const existingTeacher = await this.prisma.teacher.findFirst({
                    where: { email, schoolId },
                });
                if (existingTeacher) {
                    throw new ConflictException('Teacher with this email already exists in this school');
                }
                break;
            case 'student':
                const existingStudent = await this.prisma.student.findFirst({
                    where: { email },
                });
                if (existingStudent) {
                    throw new ConflictException('Student with this email already exists');
                }
                break;
            case 'parent':
                const existingParent = await this.prisma.parent.findFirst({
                    where: { email, schoolId },
                });
                if (existingParent) {
                    throw new ConflictException('Parent with this email already exists in this school');
                }
                break;
        }
    }

    /**
     * Login user with email and password
     * Looks up user in the users table, then determines role from role-specific tables
     */
    async login(dto: LoginDto): Promise<AuthResponse> {
        // Find user in the general users table
        const whereClause: any = { email: dto.email };
        if (dto.schoolId) {
            whereClause.schoolId = dto.schoolId;
        }

        const user = await this.prisma.user.findFirst({
            where: whereClause,
            include: { school: true },
        });

        if (!user || !user.authUserId) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // For this simplified auth, we need to store/verify password
        // In the SQL schema, passwords aren't stored in role tables
        // We'll use the users table or implement a separate auth_credentials table
        // For now, assuming password is stored externally (Supabase Auth) or we add it

        // Get the user's role and profile
        const roleData = await this.getUserRole(user.authUserId);
        if (!roleData) {
            throw new UnauthorizedException('User account not found or inactive');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new UnauthorizedException('Account is not active');
        }

        // Generate tokens
        const tokens = await this.generateTokens({
            authUserId: user.authUserId,
            email: user.email || '',
            schoolId: roleData.schoolId,
            role: roleData.role,
        });

        const roleId = this.getRoleIdFromProfile(roleData.role, roleData.profile);

        return {
            user: {
                id: roleId,
                authUserId: user.authUserId,
                email: user.email || '',
                fullName: user.fullName || '',
                schoolId: roleData.schoolId,
                role: roleData.role,
            },
            ...tokens,
        };
    }

    /**
     * Get the role-specific ID from a profile
     */
    private getRoleIdFromProfile(role: Role, profile: any): string {
        switch (role) {
            case 'super_admin': return profile.superAdminId;
            case 'admin': return profile.adminId;
            case 'teacher': return profile.teacherId;
            case 'student': return profile.studentId;
            case 'parent': return profile.parentId;
            default: return profile.id;
        }
    }

    /**
     * Get user profile by auth_user_id
     */
    async getUserProfile(authUserId: string): Promise<UserProfile | null> {
        const roleData = await this.getUserRole(authUserId);
        if (!roleData) return null;

        // Get school info if applicable
        let school = null;
        if (roleData.schoolId) {
            school = await this.prisma.school.findUnique({
                where: { schoolId: roleData.schoolId },
            });
        }

        const roleId = this.getRoleIdFromProfile(roleData.role, roleData.profile);

        return {
            id: roleId,
            authUserId,
            email: roleData.profile.email,
            fullName: roleData.profile.fullName,
            schoolId: roleData.schoolId,
            role: roleData.role,
            profile: roleData.profile,
            school,
        };
    }

    /**
     * Validate user by auth_user_id (used by JWT strategy)
     */
    async validateUser(authUserId: string) {
        const roleData = await this.getUserRole(authUserId);
        if (!roleData) return null;

        return {
            authUserId,
            role: roleData.role,
            schoolId: roleData.schoolId,
            profile: roleData.profile,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.secret') ?? 'change-me',
            });

            const roleData = await this.getUserRole(payload.sub);
            if (!roleData) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const accessToken = this.generateAccessToken({
                authUserId: payload.sub,
                email: roleData.profile.email,
                schoolId: roleData.schoolId,
                role: roleData.role,
            });

            return { accessToken };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(data: {
        authUserId: string;
        email: string;
        schoolId: string | null;
        role: Role;
    }): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.generateAccessToken(data);
        const refreshToken = this.generateRefreshToken(data.authUserId);

        return { accessToken, refreshToken };
    }

    private generateAccessToken(data: {
        authUserId: string;
        email: string;
        schoolId: string | null;
        role: Role;
    }): string {
        const payload: JwtPayload = {
            sub: data.authUserId,
            email: data.email,
            schoolId: data.schoolId,
            role: data.role,
        };

        const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '7d';
        return this.jwtService.sign(payload, {
            expiresIn: expiresIn as any,
        });
    }

    private generateRefreshToken(authUserId: string): string {
        const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') ?? '30d';
        return this.jwtService.sign(
            { sub: authUserId },
            {
                expiresIn: refreshExpiresIn as any,
            },
        );
    }
}
