import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWardDto {
    @ApiProperty({ example: 'WRD-001' })
    @IsString()
    @IsNotEmpty()
    wardCode: string;

    @ApiProperty({ example: 'General Ward A' })
    @IsString()
    @IsNotEmpty()
    wardName: string;

    @ApiProperty({ example: 'Inpatient ward for general cases' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 50 })
    @IsNumber()
    @IsNotEmpty()
    totalBeds: number;

    @ApiPropertyOptional({ example: 'STF-001' })
    @IsString()
    @IsOptional()
    wardIncharge?: string;

    @ApiPropertyOptional({ example: '1st Floor' })
    @IsString()
    @IsOptional()
    floor?: string;

    @ApiPropertyOptional({ example: 'Block A' })
    @IsString()
    @IsOptional()
    block?: string;

    @ApiPropertyOptional({ example: 'Oxygen, Emergency Bell' })
    @IsString()
    @IsOptional()
    facilities?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    remarks?: string;
}

export class UpdateWardDto extends CreateWardDto { }
