import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QueuePriority, QueueStatus } from '../entities/opd-queue.entity';

export class CreateOpdQueueDto {
  @ApiProperty({ example: 'uuid-of-patient' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'uuid-of-doctor' })
  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional({ enum: QueuePriority, default: QueuePriority.NORMAL })
  @IsEnum(QueuePriority)
  @IsOptional()
  priority?: QueuePriority;

  @ApiPropertyOptional({ example: 'Chest pain since 2 days' })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'uuid-of-appointment' })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateQueueStatusDto {
  @ApiProperty({ enum: QueueStatus })
  @IsEnum(QueueStatus)
  @IsNotEmpty()
  status: QueueStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOpdQueueDto extends PartialType(CreateOpdQueueDto) {}
