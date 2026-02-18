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
import { Type } from 'class-transformer';

const VALID_STATUSES = ['active', 'inactive', 'suspended'];

export class CreateStudentDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsUUID()
    @IsOptional()
    classId?: string;

    @IsString()
    @IsOptional()
    rollNumber?: string;
}

export class UpdateStudentDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsUUID()
    @IsOptional()
    classId?: string;

    @IsString()
    @IsOptional()
    rollNumber?: string;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;
}

export class StudentQueryDto {
    @IsUUID()
    @IsOptional()
    classId?: string;

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
