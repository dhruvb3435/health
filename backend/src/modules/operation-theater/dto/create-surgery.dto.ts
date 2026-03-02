import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SurgeryStatus } from '../entities/operation-theater.entity';

export class CreateSurgeryDto {
    @ApiProperty({ example: 'SURG-001' })
    @IsString()
    @IsNotEmpty()
    surgeryId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    surgeonId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    theatreId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    surgeryType: string;

    @ApiPropertyOptional({ enum: SurgeryStatus })
    @IsOptional()
    @IsEnum(SurgeryStatus)
    status?: SurgeryStatus;

    @ApiProperty()
    @IsDateString()
    scheduledDate: string;

    @ApiPropertyOptional({ example: '09:00' })
    @IsString()
    @IsOptional()
    startTime?: string;

    @ApiPropertyOptional({ example: '11:00' })
    @IsString()
    @IsOptional()
    endTime?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    anesthetist?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assistants?: string; // JSON string or array-like string

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    preOpNotes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    diagnosis?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    procedure?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    estimatedCost?: number;
}

export class UpdateSurgeryDto extends CreateSurgeryDto { }
