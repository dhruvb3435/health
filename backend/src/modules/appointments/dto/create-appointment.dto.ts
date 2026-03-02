import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    patientId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDateString()
    appointmentDate: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    appointmentTime: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional({ enum: AppointmentStatus })
    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isVirtual?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    meetingLink?: string;
}

export class UpdateAppointmentDto extends CreateAppointmentDto { }
