import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsIn,
    IsNumber,
    IsArray,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_STATUSES = ['active', 'inactive', 'suspended'];

export class CreateTeacherDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    qualification?: string;
}

export class UpdateTeacherDto {
    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    qualification?: string;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;
}

export class TeacherQueryDto {
    @IsString()
    @IsOptional()
    subject?: string;

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

export class AssignClassDto {
    @IsArray()
    @IsUUID('4', { each: true })
    classIds: string[];
}
