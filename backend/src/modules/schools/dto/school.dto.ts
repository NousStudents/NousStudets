import { IsNotEmpty, IsString, IsOptional, IsEmail, IsUrl } from 'class-validator';

export class CreateSchoolDto {
    @IsString()
    @IsNotEmpty()
    schoolName: string;

    @IsString()
    @IsOptional()
    subdomain?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    logo?: string;
}

export class UpdateSchoolDto {
    @IsString()
    @IsOptional()
    schoolName?: string;

    @IsString()
    @IsOptional()
    subdomain?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsString()
    @IsOptional()
    logo?: string;
}
