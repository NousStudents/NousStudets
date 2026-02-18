import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsUUID,
    IsIn,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_STATUSES = ['active', 'inactive'];

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    section?: string;

    @IsNumber()
    @IsOptional()
    grade?: number;

    @IsUUID()
    @IsOptional()
    classTeacherId?: string;

    @IsString()
    @IsOptional()
    academicYear?: string;
}

export class UpdateClassDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    section?: string;

    @IsNumber()
    @IsOptional()
    grade?: number;

    @IsUUID()
    @IsOptional()
    classTeacherId?: string;

    @IsString()
    @IsOptional()
    academicYear?: string;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;
}

export class ClassQueryDto {
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    grade?: number;

    @IsIn(VALID_STATUSES)
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    academicYear?: string;

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
