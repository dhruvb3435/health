import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffRole, StaffStatus } from '../entities/staff.entity';

export class CreateStaffDto {
    @ApiProperty({ example: 'firstName' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'lastName' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'staff@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'STF-001' })
    @IsString()
    @IsNotEmpty()
    staffId: string;

    @ApiProperty({ enum: StaffRole })
    @IsEnum(StaffRole)
    @IsNotEmpty()
    role: StaffRole;

    @ApiPropertyOptional({ enum: StaffStatus })
    @IsOptional()
    @IsEnum(StaffStatus)
    status?: StaffStatus;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    specialization?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    joiningDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    departmentId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    phoneNumber?: string;
}

export class UpdateStaffDto extends CreateStaffDto { }
