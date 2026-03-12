import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  VehicleType,
  AmbulanceStatus,
  TripType,
  TripStatus,
  TripPriority,
} from '../entities/ambulance.entity';

// ── Fleet DTOs ────────────────────────────────────────────────────────────────

export class CreateAmbulanceDto {
  @ApiProperty({
    description: 'Vehicle registration number — must be unique within the organization',
    example: 'MH-12-AB-1234',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicleNumber: string;

  @ApiProperty({
    enum: VehicleType,
    description: 'Type of ambulance / level of care it can provide',
    example: VehicleType.ADVANCED_LIFE_SUPPORT,
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Full name of the assigned driver',
    example: 'Rajesh Kumar',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  driverName: string;

  @ApiProperty({
    description: 'Driver contact phone number',
    example: '+919876543210',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  driverPhone: string;

  @ApiPropertyOptional({
    enum: AmbulanceStatus,
    description: 'Current operational status. Defaults to available.',
    example: AmbulanceStatus.AVAILABLE,
  })
  @IsEnum(AmbulanceStatus)
  @IsOptional()
  status?: AmbulanceStatus;

  @ApiPropertyOptional({
    description: 'Last known location or parking bay of the vehicle',
    example: 'Emergency Bay 2, Main Entrance',
  })
  @IsString()
  @IsOptional()
  currentLocation?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated or descriptive list of onboard medical equipment',
    example: 'Defibrillator, Oxygen cylinder (10L), ECG monitor, IV stand, Cervical collar set',
  })
  @IsString()
  @IsOptional()
  equipmentList?: string;

  @ApiPropertyOptional({
    description: 'Date of the most recent vehicle service (ISO 8601 date)',
    example: '2026-01-15',
  })
  @IsDateString()
  @IsOptional()
  lastServiceDate?: string;

  @ApiPropertyOptional({
    description: 'Insurance policy expiry date (ISO 8601 date)',
    example: '2027-03-31',
  })
  @IsDateString()
  @IsOptional()
  insuranceExpiry?: string;

  @ApiPropertyOptional({
    description: 'Vehicle fitness certificate expiry date (ISO 8601 date)',
    example: '2027-06-30',
  })
  @IsDateString()
  @IsOptional()
  fitnessExpiry?: string;
}

/**
 * All fields are optional for partial updates.
 * Extends CreateAmbulanceDto via PartialType to inherit all swagger metadata.
 */
export class UpdateAmbulanceDto extends PartialType(CreateAmbulanceDto) {
  @ApiPropertyOptional({
    description: 'Set to false to soft-deactivate this ambulance from active duty',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ── Dispatch DTOs ─────────────────────────────────────────────────────────────

export class DispatchAmbulanceDto {
  @ApiProperty({
    description: 'UUID of the ambulance to dispatch — must be in "available" status',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  ambulanceId: string;

  @ApiProperty({
    description: 'Address or landmark where the ambulance should pick up the patient',
    example: '42 MG Road, Pune, Maharashtra 411001',
  })
  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @ApiProperty({
    description: 'Destination address — typically a hospital or healthcare facility',
    example: 'HealthRay Hospital, Baner Road, Pune 411045',
  })
  @IsString()
  @IsNotEmpty()
  dropLocation: string;

  @ApiProperty({
    enum: TripType,
    description: 'Nature of the trip',
    example: TripType.EMERGENCY,
  })
  @IsEnum(TripType)
  @IsNotEmpty()
  tripType: TripType;

  @ApiProperty({
    enum: TripPriority,
    description: 'Clinical priority of the trip',
    example: TripPriority.URGENT,
  })
  @IsEnum(TripPriority)
  @IsNotEmpty()
  priority: TripPriority;

  @ApiProperty({
    description:
      'Patient name as given by the caller. Always required — serves as a snapshot ' +
      'even when patientId is supplied.',
    example: 'Priya Sharma',
  })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiPropertyOptional({
    description:
      'UUID of an existing patient record. Leave unset for walk-in callers or unknown patients.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Callback number for the patient or caller at pickup location',
    example: '+919876543210',
  })
  @IsString()
  @IsOptional()
  patientContact?: string;

  @ApiPropertyOptional({
    description:
      'UUID of an existing EmergencyCase when this trip is triggered from the ED. ' +
      'Stored as a plain reference — does not enforce a FK constraint.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  emergencyCaseId?: string;
}

// ── Trip status update ────────────────────────────────────────────────────────

export class UpdateTripStatusDto {
  @ApiProperty({
    enum: TripStatus,
    description:
      'New trip status. Automatic timestamps are recorded on specific transitions: ' +
      'patient_picked → pickupTime, en_route_hospital → arrivalTime, ' +
      'completed / cancelled → completionTime.',
    example: TripStatus.EN_ROUTE_PICKUP,
  })
  @IsEnum(TripStatus)
  @IsNotEmpty()
  status: TripStatus;

  @ApiPropertyOptional({
    description: 'Driver or dispatcher notes for this status transition',
    example: 'Traffic delay on NH-48. ETA revised to 15 minutes.',
  })
  @IsString()
  @IsOptional()
  driverNotes?: string;

  @ApiPropertyOptional({
    description: 'Distance travelled in kilometres — fill on COMPLETED status',
    example: 12.5,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  distance?: number;

  @ApiPropertyOptional({
    description: 'Fare charged for this trip — fill on COMPLETED status',
    example: 350.00,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fare?: number;
}

// ── Filter / query DTOs ───────────────────────────────────────────────────────

export class AmbulanceFiltersDto {
  @ApiPropertyOptional({ enum: AmbulanceStatus, description: 'Filter by operational status' })
  @IsEnum(AmbulanceStatus)
  @IsOptional()
  status?: AmbulanceStatus;

  @ApiPropertyOptional({ enum: VehicleType, description: 'Filter by vehicle type' })
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ description: 'Search by vehicle number or driver name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Include inactive ambulances in results',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeInactive?: boolean;
}

export class TripFiltersDto {
  @ApiPropertyOptional({ enum: TripStatus, description: 'Filter by trip status' })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiPropertyOptional({ enum: TripType, description: 'Filter by trip type' })
  @IsEnum(TripType)
  @IsOptional()
  tripType?: TripType;

  @ApiPropertyOptional({ enum: TripPriority, description: 'Filter by priority' })
  @IsEnum(TripPriority)
  @IsOptional()
  priority?: TripPriority;

  @ApiPropertyOptional({ description: 'Filter trips for a specific ambulance UUID' })
  @IsUUID()
  @IsOptional()
  ambulanceId?: string;

  @ApiPropertyOptional({
    description: 'ISO date string — include trips dispatched on or after this date',
    example: '2026-03-01',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'ISO date string — include trips dispatched on or before this date',
    example: '2026-03-31',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Records per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
