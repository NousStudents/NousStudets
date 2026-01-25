import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret') ?? 'change-me',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateUser(payload.sub);

        if (!user) {
            throw new UnauthorizedException('User not found or inactive');
        }

        // Return user data that will be attached to request.user
        // Using auth_user_id as the subject (sub) to identify the user
        return {
            sub: user.authUserId,           // auth_user_id for JWT subject
            authUserId: user.authUserId,
            role: user.role,
            schoolId: user.schoolId,
            profile: user.profile,
        };
    }
}
