import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodType } from '../entities/patient.entity';

export class CreatePatientDto {
    @ApiProperty({ example: 'dhruv' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'bagadiya' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'patient@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'PAT-001' })
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty({ enum: BloodType, example: BloodType.A_POSITIVE })
    @IsEnum(BloodType)
    @IsNotEmpty()
    bloodType: BloodType;

    @ApiProperty({ example: 'Peanuts', isArray: true, required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allergies?: string[];

    @ApiProperty({ example: 'Diabetes', isArray: true, required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    chronicDiseases?: string[];

    @ApiProperty({ example: 'Blue Cross', required: false })
    @IsString()
    @IsOptional()
    insuranceProvider?: string;

    @ApiProperty({ example: '1990-01-01', required: false })
    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @ApiProperty({ example: 'Male', required: false })
    @IsString()
    @IsOptional()
    gender?: string;

    @ApiProperty({ example: '+1234567890', required: false })
    @IsString()
    @IsOptional()
    phoneNumber?: string;
}
