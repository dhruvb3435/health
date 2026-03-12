import { IsString, IsUUID, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { DischargeType, DischargeStatus } from '../entities/discharge-summary.entity';

class InvestigationDto {
    @IsString()
    name: string;

    @IsString()
    result: string;

    @IsString()
    date: string;
}

class MedicationDto {
    @IsString()
    medicine: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsString()
    duration: string;

    @IsString()
    @IsOptional()
    instructions?: string;
}

export class CreateDischargeSummaryDto {
    @IsUUID()
    patientId: string;

    @IsUUID()
    doctorId: string;

    @IsUUID()
    @IsOptional()
    admissionId?: string;

    @IsDateString()
    admissionDate: string;

    @IsDateString()
    dischargeDate: string;

    @IsEnum(DischargeType)
    @IsOptional()
    dischargeType?: DischargeType;

    @IsString()
    diagnosisAtAdmission: string;

    @IsString()
    @IsOptional()
    diagnosisAtDischarge?: string;

    @IsString()
    @IsOptional()
    chiefComplaints?: string;

    @IsString()
    @IsOptional()
    historyOfPresentIllness?: string;

    @IsString()
    @IsOptional()
    pastHistory?: string;

    @IsString()
    @IsOptional()
    examinationFindings?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvestigationDto)
    @IsOptional()
    investigationsPerformed?: InvestigationDto[];

    @IsString()
    @IsOptional()
    treatmentGiven?: string;

    @IsString()
    @IsOptional()
    proceduresPerformed?: string;

    @IsString()
    @IsOptional()
    courseInHospital?: string;

    @IsString()
    @IsOptional()
    conditionAtDischarge?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicationDto)
    @IsOptional()
    dischargeMedications?: MedicationDto[];

    @IsString()
    @IsOptional()
    dietaryAdvice?: string;

    @IsString()
    @IsOptional()
    activityRestrictions?: string;

    @IsDateString()
    @IsOptional()
    followUpDate?: string;

    @IsString()
    @IsOptional()
    followUpInstructions?: string;

    @IsString()
    @IsOptional()
    emergencyInstructions?: string;

    @IsString()
    @IsOptional()
    referralDetails?: string;
}

export class UpdateDischargeSummaryDto extends PartialType(CreateDischargeSummaryDto) {}

export class UpdateDischargeStatusDto {
    @IsEnum(DischargeStatus)
    status: DischargeStatus;
}
