import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsEnum,
    IsArray,
} from 'class-validator';
import { AppRole, UserStatus } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsUUID()
    @IsNotEmpty()
    schoolId: string;

    @IsArray()
    @IsEnum(AppRole, { each: true })
    @IsOptional()
    roles?: AppRole[];
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsEnum(UserStatus)
    @IsOptional()
    status?: UserStatus;
}

export class AssignRoleDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsEnum(AppRole)
    @IsNotEmpty()
    role: AppRole;
}

export class RemoveRoleDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsEnum(AppRole)
    @IsNotEmpty()
    role: AppRole;
}

export class UserQueryDto {
    @IsUUID()
    @IsOptional()
    schoolId?: string;

    @IsEnum(AppRole)
    @IsOptional()
    role?: AppRole;

    @IsEnum(UserStatus)
    @IsOptional()
    status?: UserStatus;

    @IsString()
    @IsOptional()
    search?: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}
