import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsPositive,
  IsEmail,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ClaimStatus, TreatmentType } from '../entities/insurance.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

// ---------------------------------------------------------------------------
// Nested DTOs
// ---------------------------------------------------------------------------

export class ClaimDocumentDto {
  @ApiProperty({ example: 'Discharge Summary' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://s3.example.com/doc.pdf' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'pdf', description: 'File type / MIME hint' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

// ---------------------------------------------------------------------------
// Provider DTOs
// ---------------------------------------------------------------------------

export class CreateInsuranceProviderDto {
  @ApiProperty({ example: 'Star Health Insurance', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName: string;

  @ApiProperty({ example: 'STAR-001', maxLength: 50, description: 'Unique provider code within the organization' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  providerCode: string;

  @ApiPropertyOptional({ example: 'Ramesh Sharma', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'claims@starhealth.in' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: '123, Insurance Tower, Mumbai - 400001' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'AABCS1234F' })
  @IsString()
  @IsOptional()
  panNumber?: string;

  @ApiPropertyOptional({ example: '27AABCS1234F1ZA' })
  @IsString()
  @IsOptional()
  gstNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateInsuranceProviderDto extends PartialType(CreateInsuranceProviderDto) {}

// ---------------------------------------------------------------------------
// Claim DTOs
// ---------------------------------------------------------------------------

export class CreateInsuranceClaimDto {
  @ApiProperty({ description: 'UUID of the patient', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'UUID of the treating doctor', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ description: 'UUID of the insurance provider', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiPropertyOptional({ description: 'UUID of the linked invoice', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({ example: 'POL-2024-00123', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  policyNumber: string;

  @ApiProperty({ example: 'Priya Mehta', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  policyHolderName: string;

  @ApiPropertyOptional({
    example: 'spouse',
    description: 'Relationship of the policy holder to the patient: self / spouse / child / parent',
  })
  @IsString()
  @IsOptional()
  relationToPatient?: string;

  @ApiPropertyOptional({ example: '2024-06-10', description: 'Hospital admission date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  admissionDate?: string;

  @ApiPropertyOptional({ example: '2024-06-15', description: 'Hospital discharge date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dischargeDate?: string;

  @ApiPropertyOptional({ example: 'J18.9', description: 'ICD-10 diagnosis code' })
  @IsString()
  @IsOptional()
  diagnosisCode?: string;

  @ApiProperty({ example: 'Community-acquired pneumonia requiring hospitalization' })
  @IsString()
  @IsNotEmpty()
  diagnosisDescription: string;

  @ApiProperty({ enum: TreatmentType, example: TreatmentType.CASHLESS })
  @IsEnum(TreatmentType)
  @IsNotEmpty()
  treatmentType: TreatmentType;

  @ApiProperty({ example: 85000.0, description: 'Total claimed amount (INR)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  claimAmount: number;

  @ApiPropertyOptional({ example: 'TPA-REF-2024-456', description: 'TPA reference number for the claim' })
  @IsString()
  @IsOptional()
  tpaReferenceNumber?: string;

  @ApiPropertyOptional({ example: 'PREAUTH-2024-789', description: 'Pre-authorisation number' })
  @IsString()
  @IsOptional()
  preAuthNumber?: string;

  @ApiPropertyOptional({ example: '2024-06-09', description: 'Pre-auth approval date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  preAuthDate?: string;

  @ApiPropertyOptional({
    type: [ClaimDocumentDto],
    description: 'Supporting documents attached to the claim',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimDocumentDto)
  @IsOptional()
  documents?: ClaimDocumentDto[];

  @ApiPropertyOptional({ example: 'Patient was referred by Dr. Sharma from city clinic.' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateInsuranceClaimDto extends PartialType(CreateInsuranceClaimDto) {}

// ---------------------------------------------------------------------------
// Status transition DTO
// ---------------------------------------------------------------------------

export class UpdateClaimStatusDto {
  @ApiProperty({
    enum: ClaimStatus,
    example: ClaimStatus.APPROVED,
    description: 'New status for the insurance claim',
  })
  @IsEnum(ClaimStatus)
  @IsNotEmpty()
  status: ClaimStatus;

  @ApiPropertyOptional({
    example: 72000.0,
    description: 'Amount approved by the insurer (required when status = approved / partially_approved)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  approvedAmount?: number;

  @ApiPropertyOptional({
    example: 68000.0,
    description: 'Amount settled/disbursed (required when status = settled)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  settledAmount?: number;

  @ApiPropertyOptional({
    example: 4000.0,
    description: 'Amount deducted from the approved amount',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  deductionAmount?: number;

  @ApiPropertyOptional({ example: 'Policy co-pay clause applied (10%)' })
  @IsString()
  @IsOptional()
  deductionReason?: string;

  @ApiPropertyOptional({ example: 'Please provide original discharge summary.' })
  @IsString()
  @IsOptional()
  queryDetails?: string;

  @ApiPropertyOptional({ example: 'Pre-existing condition exclusion under clause 4.2.' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'Payment processed via NEFT to registered bank account.' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

// ---------------------------------------------------------------------------
// Filter / pagination DTOs
// ---------------------------------------------------------------------------

export class ProviderFilterDto {
  @ApiPropertyOptional({ description: 'Search by provider name or code' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active / inactive providers' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class ClaimFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClaimStatus, description: 'Filter by claim status' })
  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;

  @ApiPropertyOptional({ description: 'Filter by insurance provider UUID' })
  @IsUUID()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Filter by patient UUID' })
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ enum: TreatmentType, description: 'Filter by treatment type' })
  @IsEnum(TreatmentType)
  @IsOptional()
  treatmentType?: TreatmentType;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Claims submitted on or after this date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Claims submitted on or before this date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
