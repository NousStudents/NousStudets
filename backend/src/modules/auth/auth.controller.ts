import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthResponse, Role } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Register a new student
     * POST /auth/register/student
     * Rate limited: 5 requests per 5 minutes (300s)
     */
    @Post('register/student')
    @Throttle({ default: { limit: 5, ttl: 300 } }) // 5 requests per 5 minutes
    @HttpCode(HttpStatus.CREATED)
    async registerStudent(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: 'student' as Role });
    }

    /**
     * Register a new teacher
     * POST /auth/register/teacher
     * Rate limited: 5 requests per 5 minutes (300s)
     */
    @Post('register/teacher')
    @Throttle({ default: { limit: 5, ttl: 300 } })
    @HttpCode(HttpStatus.CREATED)
    async registerTeacher(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: 'teacher' as Role });
    }

    /**
     * Register a new parent
     * POST /auth/register/parent
     * Rate limited: 5 requests per 5 minutes (300s)
     */
    @Post('register/parent')
    @Throttle({ default: { limit: 5, ttl: 300 } })
    @HttpCode(HttpStatus.CREATED)
    async registerParent(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: 'parent' as Role });
    }

    /**
     * Register a new admin
     * POST /auth/register/admin
     * Rate limited: 5 requests per 5 minutes (300s)
     */
    @Post('register/admin')
    @Throttle({ default: { limit: 5, ttl: 300 } })
    @HttpCode(HttpStatus.CREATED)
    async registerAdmin(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: 'admin' as Role });
    }

    /**
     * Register a new user (Generic - defaulting to student)
     * POST /auth/register
     * Rate limited: 5 requests per 5 minutes (300s)
     */
    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 300 } })
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register({ ...dto, role: 'student' as Role });
    }

    /**
     * Login with email and password
     * POST /auth/login
     * Rate limited: 5 requests per minute (60s) to prevent brute-force
     */
    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 attempts per minute
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(dto);
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
    async getProfile(@CurrentUser('sub') authUserId: string) {
        const user = await this.authService.getUserProfile(authUserId);
        if (!user) return null;

        return {
            id: user.id,
            authUserId: user.authUserId,
            email: user.email,
            fullName: user.fullName,
            schoolId: user.schoolId,
            school: user.school,
            role: user.role,
            profile: user.profile,
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
