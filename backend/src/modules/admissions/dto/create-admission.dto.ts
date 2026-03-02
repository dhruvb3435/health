import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';
import { AdmissionStatus } from '../entities/admission.entity';

export class CreateAdmissionDto {
    @IsString()
    @IsNotEmpty()
    admissionId: string;

    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsUUID()
    @IsNotEmpty()
    doctorId: string;

    @IsUUID()
    @IsNotEmpty()
    wardId: string;

    @IsUUID()
    @IsNotEmpty()
    bedId: string;

    @IsDateString()
    @IsNotEmpty()
    admissionDate: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    status?: AdmissionStatus;
}

export class UpdateVitalsDto {
    @IsString()
    @IsNotEmpty()
    bp: string;

    @IsNotEmpty()
    pulse: number;

    @IsNotEmpty()
    temp: number;

    @IsNotEmpty()
    spO2: number;

    @IsOptional()
    weight?: number;

    @IsString()
    @IsNotEmpty()
    recordedBy: string;
}

export class AddNursingNoteDto {
    @IsString()
    @IsNotEmpty()
    note: string;

    @IsString()
    @IsNotEmpty()
    nurseId: string;

    @IsString()
    @IsNotEmpty()
    nurseName: string;
}

export class DischargeAdmissionDto {
    @IsDateString()
    @IsNotEmpty()
    dischargeDate: string;

    @IsString()
    @IsNotEmpty()
    dischargeSummary: string;

    @IsString()
    @IsOptional()
    dischargePlan?: string;
}
