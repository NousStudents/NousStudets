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
import { AppRole } from '@prisma/client';

export interface JwtPayload {
    sub: string; // userId
    email: string;
    schoolId: string;
    roles: AppRole[];
}

export interface AuthResponse {
    user: {
        userId: string;
        email: string;
        fullName: string;
        schoolId: string;
        roles: AppRole[];
    };
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Register a new user
     */
    async register(dto: RegisterDto): Promise<AuthResponse> {
        // Check if school exists
        const school = await this.prisma.school.findUnique({
            where: { schoolId: dto.schoolId },
        });

        if (!school) {
            throw new BadRequestException('Invalid school ID');
        }

        // Check if user already exists in this school
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                schoolId: dto.schoolId,
            },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists in this school');
        }

        // Hash password
        const saltRounds = this.configService.get<number>('bcrypt.saltRounds');
        const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

        // Create user with default student role
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                fullName: dto.fullName,
                phone: dto.phone,
                schoolId: dto.schoolId,
                mustChangePassword: false,
                roles: {
                    create: {
                        role: AppRole.student, // Default role
                    },
                },
            },
            include: {
                roles: true,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: {
                userId: user.userId,
                email: user.email,
                fullName: user.fullName,
                schoolId: user.schoolId,
                roles: user.roles.map((r) => r.role),
            },
            ...tokens,
        };
    }

    /**
     * Login user with email and password
     */
    async login(dto: LoginDto): Promise<AuthResponse> {
        // Find user
        const whereClause: any = { email: dto.email };
        if (dto.schoolId) {
            whereClause.schoolId = dto.schoolId;
        }

        const user = await this.prisma.user.findFirst({
            where: whereClause,
            include: {
                roles: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        if (!user.password) {
            throw new UnauthorizedException('Please use your original login method');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (user.status !== 'active') {
            throw new UnauthorizedException('Account is not active');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: {
                userId: user.userId,
                email: user.email,
                fullName: user.fullName,
                schoolId: user.schoolId,
                roles: user.roles.map((r) => r.role),
            },
            ...tokens,
        };
    }

    /**
     * Change user password
     */
    async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { userId },
        });

        if (!user || !user.password) {
            throw new BadRequestException('Cannot change password for this user');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const saltRounds = this.configService.get<number>('bcrypt.saltRounds');
        const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

        // Update password
        await this.prisma.user.update({
            where: { userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        });

        return { message: 'Password changed successfully' };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.secret'),
            });

            const user = await this.prisma.user.findUnique({
                where: { userId: payload.sub },
                include: { roles: true },
            });

            if (!user || user.status !== 'active') {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const accessToken = this.generateAccessToken(user);
            return { accessToken };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Validate user by ID (used by JWT strategy)
     */
    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { userId },
            include: { roles: true },
        });

        if (!user || user.status !== 'active') {
            return null;
        }

        return user;
    }

    /**
     * Get user by ID with roles
     */
    async getUserWithRoles(userId: string) {
        return this.prisma.user.findUnique({
            where: { userId },
            include: {
                roles: true,
                school: true,
            },
        });
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return { accessToken, refreshToken };
    }

    private generateAccessToken(user: any): string {
        const payload: JwtPayload = {
            sub: user.userId,
            email: user.email,
            schoolId: user.schoolId,
            roles: user.roles.map((r: any) => r.role),
        };

        return this.jwtService.sign(payload, {
            expiresIn: this.configService.get<string>('jwt.expiresIn'),
        });
    }

    private generateRefreshToken(user: any): string {
        return this.jwtService.sign(
            { sub: user.userId },
            {
                expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
            },
        );
    }
}
