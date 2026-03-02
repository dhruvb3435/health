import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
    @ApiProperty({ example: 'test' })
    @IsString()
    @IsNotEmpty()
    recordType: string;

    @ApiProperty({ example: 'Annual Checkup' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Patient complains of mild headache.' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    findings?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    diagnosis?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    treatment?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    doctorName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    doctorId?: string;

    @ApiProperty({ isArray: true, required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    attachmentUrls?: string[];

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    visitDate?: Date;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isConfidential?: boolean;
}
