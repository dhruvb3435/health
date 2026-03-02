import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
    @ApiProperty({ example: 'firstName' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'lastName' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'doctor@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'DOC-001' })
    @IsString()
    @IsNotEmpty()
    doctorId: string;

    @ApiProperty({ example: 'Cardiology' })
    @IsString()
    @IsNotEmpty()
    specialization: string;

    @ApiPropertyOptional({ example: '12345' })
    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @ApiPropertyOptional({ example: 10 })
    @IsNumber()
    @IsOptional()
    yearsOfExperience?: number;

    @ApiPropertyOptional({ example: 500 })
    @IsNumber()
    @IsOptional()
    consultationFee?: number;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateDoctorDto extends CreateDoctorDto { }
