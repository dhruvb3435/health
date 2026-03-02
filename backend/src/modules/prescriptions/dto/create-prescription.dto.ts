import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionStatus } from '../entities/prescription.entity';

class MedicineItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    medicineId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    medicineName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    dosage: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    frequency: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    duration: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    instructions?: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;
}

export class CreatePrescriptionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    doctorId?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    prescriptionNumber: string;

    @ApiPropertyOptional({ enum: PrescriptionStatus })
    @IsOptional()
    @IsEnum(PrescriptionStatus)
    status?: PrescriptionStatus;

    @ApiProperty({ type: [MedicineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicineItemDto)
    medicines: MedicineItemDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    diagnosis?: string;

    @ApiProperty()
    @IsDateString()
    issuedDate: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    expiryDate?: string;
}

export class UpdatePrescriptionDto extends CreatePrescriptionDto { }
