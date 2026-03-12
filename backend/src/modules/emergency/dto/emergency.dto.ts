import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsInt,
  IsPositive,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TriageLevel, ArrivalMode, EmergencyStatus } from '../entities/emergency.entity';

// ── Nested DTOs ──────────────────────────────────────────────────────────────

export class VitalsDto {
  @ApiPropertyOptional({
    description: 'Blood pressure reading',
    example: '120/80 mmHg',
  })
  @IsString()
  @IsOptional()
  bp?: string;

  @ApiPropertyOptional({
    description: 'Pulse / heart rate in beats per minute',
    example: 88,
    minimum: 0,
    maximum: 300,
  })
  @IsNumber()
  @Min(0)
  @Max(300)
  @IsOptional()
  pulse?: number;

  @ApiPropertyOptional({
    description: 'Body temperature in degrees Celsius',
    example: 37.5,
    minimum: 25,
    maximum: 45,
  })
  @IsNumber()
  @Min(25)
  @Max(45)
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Peripheral oxygen saturation (%)',
    example: 98,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  spO2?: number;

  @ApiPropertyOptional({
    description: 'Respiratory rate in breaths per minute',
    example: 18,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  respiratoryRate?: number;

  @ApiPropertyOptional({
    description: 'Glasgow Coma Scale score (3–15)',
    example: 15,
    minimum: 3,
    maximum: 15,
  })
  @IsInt()
  @Min(3)
  @Max(15)
  @IsOptional()
  gcs?: number;
}

// ── Main DTOs ────────────────────────────────────────────────────────────────

export class RegisterEmergencyDto {
  @ApiProperty({
    description: 'Primary reason for presenting to the emergency department',
    example: 'Severe chest pain with shortness of breath, onset 30 minutes ago',
  })
  @IsString()
  @IsNotEmpty()
  chiefComplaint: string;

  @ApiProperty({
    enum: ArrivalMode,
    description: 'How the patient arrived at the ED',
    example: ArrivalMode.AMBULANCE,
  })
  @IsEnum(ArrivalMode)
  @IsNotEmpty()
  arrivalMode: ArrivalMode;

  @ApiPropertyOptional({
    description: 'UUID of an existing patient record. Leave unset for unidentified patients.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({
    enum: TriageLevel,
    description: 'ESI triage level — can be set now or later via the /triage endpoint',
    example: TriageLevel.LEVEL_2_EMERGENCY,
  })
  @IsEnum(TriageLevel)
  @IsOptional()
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({
    type: VitalsDto,
    description: 'Initial vital signs at registration — can be updated at triage',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VitalsDto)
  @IsOptional()
  vitals?: VitalsDto;

  @ApiPropertyOptional({
    description: 'Clinical injury / presentation category',
    example: 'cardiac',
  })
  @IsString()
  @IsOptional()
  injuryType?: string;

  @ApiPropertyOptional({
    description: 'Known drug or environmental allergies',
    example: 'Penicillin, NSAIDs',
  })
  @IsString()
  @IsOptional()
  allergies?: string;
}

export class TriageDto {
  @ApiProperty({
    enum: TriageLevel,
    description: 'ESI triage level assigned by triage nurse/physician',
    example: TriageLevel.LEVEL_2_EMERGENCY,
  })
  @IsEnum(TriageLevel)
  @IsNotEmpty()
  triageLevel: TriageLevel;

  @ApiProperty({
    type: VitalsDto,
    description: 'Vital signs recorded at triage',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VitalsDto)
  @IsNotEmpty()
  vitals: VitalsDto;

  @ApiPropertyOptional({
    description: 'UUID of the doctor being assigned to this case',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional({
    description: 'Clinical notes recorded at triage',
    example: 'Patient is diaphoretic, radiating pain to left arm. ECG ordered.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEmergencyCaseDto extends PartialType(RegisterEmergencyDto) {
  @ApiPropertyOptional({
    description: 'Clinical notes about the ongoing treatment',
    example: 'Aspirin 300mg given. IV access secured. Awaiting troponin results.',
  })
  @IsString()
  @IsOptional()
  treatmentNotes?: string;

  @ApiPropertyOptional({
    description: 'Known relevant medical history',
    example: 'Hypertension, Type 2 Diabetes Mellitus, prior MI in 2022',
  })
  @IsString()
  @IsOptional()
  medicalHistory?: string;
}

export class UpdateEmergencyStatusDto {
  @ApiProperty({
    enum: EmergencyStatus,
    description: 'New status for the emergency case',
    example: EmergencyStatus.IN_TREATMENT,
  })
  @IsEnum(EmergencyStatus)
  @IsNotEmpty()
  status: EmergencyStatus;

  @ApiPropertyOptional({
    description: 'Clinical notes about the treatment provided',
    example: 'Thrombolytics administered. Patient stabilised.',
  })
  @IsString()
  @IsOptional()
  treatmentNotes?: string;

  @ApiPropertyOptional({
    description:
      'Final disposition description — required when status is discharged, transferred, or admitted',
    example: 'Admitted to CCU Bed 4 for monitoring',
  })
  @IsString()
  @IsOptional()
  disposition?: string;

  @ApiPropertyOptional({
    description: 'UUID of the Admission record if patient was admitted from ED',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  admissionId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the treating doctor — can be updated here if not set at triage',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  doctorId?: string;
}

// ── Query / filter DTOs ──────────────────────────────────────────────────────

export class EmergencyCaseFiltersDto {
  @ApiPropertyOptional({ enum: EmergencyStatus })
  @IsEnum(EmergencyStatus)
  @IsOptional()
  status?: EmergencyStatus;

  @ApiPropertyOptional({ enum: TriageLevel })
  @IsEnum(TriageLevel)
  @IsOptional()
  triageLevel?: TriageLevel;

  @ApiPropertyOptional({ enum: ArrivalMode })
  @IsEnum(ArrivalMode)
  @IsOptional()
  arrivalMode?: ArrivalMode;

  @ApiPropertyOptional({ description: 'Filter by doctor UUID' })
  @IsUUID()
  @IsOptional()
  doctorId?: string;
}

export class EmergencyCaseHistoryFiltersDto extends EmergencyCaseFiltersDto {
  @ApiPropertyOptional({ description: 'ISO date string — fetch cases from this date', example: '2026-01-01' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date string — fetch cases up to this date', example: '2026-03-12' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', default: 20, minimum: 1, maximum: 100 })
  @IsInt()
  @IsPositive()
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
