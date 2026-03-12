import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  IsUUID,
  IsPositive,
  Min,
  Max,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  BloodGroup,
  BloodComponent,
  InventoryStatus,
  RequestPriority,
  RequestStatus,
} from '../entities/blood-bank.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

// ---------------------------------------------------------------------------
// Blood Inventory DTOs
// ---------------------------------------------------------------------------

export class CreateBloodInventoryDto {
  @ApiProperty({ enum: BloodGroup, example: BloodGroup.O_POSITIVE })
  @IsEnum(BloodGroup)
  @IsNotEmpty()
  bloodGroup: BloodGroup;

  @ApiProperty({ enum: BloodComponent, example: BloodComponent.WHOLE_BLOOD })
  @IsEnum(BloodComponent)
  @IsNotEmpty()
  component: BloodComponent;

  @ApiProperty({ example: 1, description: 'Number of units in the bag' })
  @IsInt()
  @IsPositive()
  units: number;

  @ApiProperty({ example: 'BAG-2024-001', description: 'Unique bag number / barcode' })
  @IsString()
  @IsNotEmpty()
  bagNumber: string;

  @ApiProperty({ example: '2024-06-01', description: 'Date blood was collected (YYYY-MM-DD)' })
  @IsDateString()
  collectedDate: string;

  @ApiProperty({ example: '2024-06-36', description: 'Expiry date of the blood unit (YYYY-MM-DD)' })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ enum: InventoryStatus, default: InventoryStatus.AVAILABLE })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  donorName: string;

  @ApiPropertyOptional({ example: '+1-555-0100' })
  @IsString()
  @IsOptional()
  donorContact?: string;

  @ApiPropertyOptional({ example: 28 })
  @IsInt()
  @Min(18)
  @Max(65)
  @IsOptional()
  donorAge?: number;

  @ApiPropertyOptional({ example: 'Compatible', description: 'Cross-match result notes' })
  @IsString()
  @IsOptional()
  crossMatchResult?: string;

  @ApiPropertyOptional({ example: 'Refrigerator-A / Shelf-3' })
  @IsString()
  @IsOptional()
  storageLocation?: string;
}

export class UpdateBloodInventoryDto extends PartialType(CreateBloodInventoryDto) {}

// ---------------------------------------------------------------------------
// Blood Request DTOs
// ---------------------------------------------------------------------------

export class CreateBloodRequestDto {
  @ApiProperty({ description: 'UUID of the patient', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'UUID of the requesting doctor', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ enum: BloodGroup, example: BloodGroup.A_POSITIVE })
  @IsEnum(BloodGroup)
  @IsNotEmpty()
  bloodGroup: BloodGroup;

  @ApiProperty({ enum: BloodComponent, example: BloodComponent.PACKED_RBC })
  @IsEnum(BloodComponent)
  @IsNotEmpty()
  component: BloodComponent;

  @ApiProperty({ example: 2, description: 'Number of units requested' })
  @IsInt()
  @IsPositive()
  unitsRequested: number;

  @ApiPropertyOptional({ enum: RequestPriority, default: RequestPriority.ROUTINE })
  @IsEnum(RequestPriority)
  @IsOptional()
  priority?: RequestPriority;

  @ApiPropertyOptional({ example: '2024-06-15T08:00:00.000Z', description: 'When the blood is needed by' })
  @IsISO8601()
  @IsOptional()
  requiredDate?: string;

  @ApiProperty({ example: 'Pre-operative transfusion for cardiac surgery' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'Patient has rare antibodies — cross-match required before issuing' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBloodRequestStatusDto {
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED })
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @ApiPropertyOptional({ example: 2, description: 'Number of units actually issued (required when status=issued)' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  unitsIssued?: number;

  @ApiPropertyOptional({ example: 'Approved after cross-match confirmation' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ---------------------------------------------------------------------------
// Filter / pagination DTOs
// ---------------------------------------------------------------------------

export class InventoryFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BloodGroup })
  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ enum: BloodComponent })
  @IsEnum(BloodComponent)
  @IsOptional()
  component?: BloodComponent;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;
}

export class RequestFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BloodGroup })
  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: RequestPriority })
  @IsEnum(RequestPriority)
  @IsOptional()
  priority?: RequestPriority;
}
