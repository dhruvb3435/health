import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabTestStatus } from '../entities/lab-test.entity';

class TestResultDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    parameter: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    unit: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    normalRange: string;

    @ApiProperty({ enum: ['normal', 'abnormal', 'critical'] })
    @IsEnum(['normal', 'abnormal', 'critical'])
    status: 'normal' | 'abnormal' | 'critical';
}

export class CreateLabTestDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    testName: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    testCode?: string;

    @ApiPropertyOptional({ enum: LabTestStatus })
    @IsOptional()
    @IsEnum(LabTestStatus)
    status?: LabTestStatus;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    orderedBy?: string;

    @ApiProperty()
    @IsDateString()
    orderedDate: string;

    @ApiPropertyOptional({ type: [TestResultDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TestResultDto)
    testResults?: TestResultDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    interpretation?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    reportedBy?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateLabTestDto extends CreateLabTestDto { }
