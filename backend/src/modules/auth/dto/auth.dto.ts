import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsUUID, Matches } from 'class-validator';

// OWASP Password Policy Regex
// Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const OWASP_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8)
    @Matches(OWASP_PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    password: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsUUID()
    @IsNotEmpty()
    schoolId: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsUUID()
    @IsOptional()
    schoolId?: string; // Required for multi-tenant login
}

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @Matches(OWASP_PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    newPassword: string;
}

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
