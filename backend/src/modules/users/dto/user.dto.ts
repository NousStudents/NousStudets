import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsIn,
    IsNumber,
    Min,
} from 'class-validator';
import { VALID_ROLES } from '../../../common/types/role.type';
import type { Role } from '../../../common/types/role.type';
import { Type } from 'class-transformer';

// Valid status values (matching SQL schema)
const VALID_STATUSES = ['active', 'inactive', 'suspended'];

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsIn(VALID_ROLES)
    @IsNotEmpty()
    role: Role;

    // For students - optional classId
    @IsUUID()
    @IsOptional()
    classId?: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;
}

export class UserQueryDto {
    @IsIn(VALID_ROLES)
    @IsOptional()
    role?: Role;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    limit?: number;
}

// Legacy DTOs - kept for API compatibility but functionality deprecated
export class AssignRoleDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsIn(VALID_ROLES)
    @IsNotEmpty()
    role: Role;
}

export class RemoveRoleDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsIn(VALID_ROLES)
    @IsNotEmpty()
    role: Role;
}
