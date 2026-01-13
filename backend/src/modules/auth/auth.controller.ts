import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Register a new student
     * POST /auth/register/student
     */
    @Post('register/student')
    @HttpCode(HttpStatus.CREATED)
    async registerStudent(@Body() dto: RegisterDto): Promise<AuthResponse> {
        // Enforce role
        const studentDto = { ...dto, role: AppRole.student };
        // Ideally validate student-specific fields here or in service
        return this.authService.register(studentDto);
    }

    /**
     * Register a new teacher
     * POST /auth/register/teacher
     */
    @Post('register/teacher')
    @HttpCode(HttpStatus.CREATED)
    async registerTeacher(@Body() dto: RegisterDto): Promise<AuthResponse> {
        const teacherDto = { ...dto, role: AppRole.teacher };
        return this.authService.register(teacherDto);
    }

    /**
     * Register a new parent
     * POST /auth/register/parent
     */
    @Post('register/parent')
    @HttpCode(HttpStatus.CREATED)
    async registerParent(@Body() dto: RegisterDto): Promise<AuthResponse> {
        const parentDto = { ...dto, role: AppRole.parent };
        return this.authService.register(parentDto);
    }

    /**
     * Register a new user (Generic - defaulting to student)
     * POST /auth/register
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: AppRole.student });
    }

    /**
     * Login with email and password
     * POST /auth/login
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(dto);
    }

    /**
     * Change password (requires authentication)
     * POST /auth/change-password
     */
    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('userId') userId: string,
        @Body() dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        return this.authService.changePassword(userId, dto);
    }

    /**
     * Refresh access token
     * POST /auth/refresh
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() dto: RefreshTokenDto): Promise<{ accessToken: string }> {
        return this.authService.refreshToken(dto.refreshToken);
    }

    /**
     * Get current user profile (requires authentication)
     * GET /auth/me
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser('userId') userId: string) {
        const user = await this.authService.getUserProfile(userId);
        if (!user) return null;

        // Determine primary role for frontend (Admin > Teacher > Parent > Student)
        const roles = user.roles.map(r => r.role);
        let primaryRole = roles[0]?.role;

        if (roles.includes(AppRole.admin)) primaryRole = AppRole.admin;
        else if (roles.includes(AppRole.teacher)) primaryRole = AppRole.teacher;
        else if (roles.includes(AppRole.parent)) primaryRole = AppRole.parent;
        else if (roles.includes(AppRole.student)) primaryRole = AppRole.student;

        return {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            schoolId: user.schoolId,
            school: user.school,
            role: primaryRole,
            profile: user.profile,
            mustChangePassword: user.mustChangePassword,
            status: user.status,
            createdAt: user.createdAt,
        };
    }

    /**
     * Logout (client-side token removal, backend can invalidate refresh token)
     * POST /auth/logout
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(): Promise<{ message: string }> {
        // In a more advanced implementation, you would:
        // 1. Store refresh tokens in database
        // 2. Invalidate the refresh token here
        return { message: 'Logged out successfully' };
    }
}
