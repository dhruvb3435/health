import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicineDto {
    @ApiProperty({ example: 'MED-001' })
    @IsString()
    @IsNotEmpty()
    medicineCode: string;

    @ApiProperty({ example: 'Paracetamol' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Acetaminophen', required: false })
    @IsString()
    @IsOptional()
    genericName?: string;

    @ApiProperty({ example: '500mg' })
    @IsString()
    @IsNotEmpty()
    strength: string;

    @ApiProperty({ example: 'Tablet' })
    @IsString()
    @IsNotEmpty()
    formulation: string;

    @ApiProperty({ example: 'GSK', required: false })
    @IsString()
    @IsOptional()
    manufacturer?: string;

    @ApiProperty({ example: 'BATCH-123', required: false })
    @IsString()
    @IsOptional()
    batchNumber?: string;

    @ApiProperty({ example: 'Pain reliever and fever reducer', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 10.50 })
    @IsNumber()
    purchasePrice: number;

    @ApiProperty({ example: 15.00 })
    @IsNumber()
    sellingPrice: number;

    @ApiProperty({ example: 100 })
    @IsNumber()
    stock: number;

    @ApiProperty({ example: 50, required: false })
    @IsNumber()
    @IsOptional()
    reorderLevel?: number;

    @ApiProperty({ example: '2025-12-31', required: false })
    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @ApiProperty({ example: ['Nausea', 'Dizziness'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sideEffects?: string[];

    @ApiProperty({ example: ['Liver disease'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    contraindications?: string[];

    @ApiProperty({ example: 'Store in cool dry place', required: false })
    @IsString()
    @IsOptional()
    storageConditions?: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
