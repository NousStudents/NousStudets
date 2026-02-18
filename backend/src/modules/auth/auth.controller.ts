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

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Register a new user
     * POST /auth/register
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(dto);
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
        const user = await this.authService.getUserWithRoles(userId);
        return {
            userId: user.userId,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            schoolId: user.schoolId,
            school: user.school,
            roles: user.roles.map((r) => r.role),
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
