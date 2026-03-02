import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryType, InventoryStatus } from '../entities/inventory.entity';

export class CreateInventoryDto {
    @ApiProperty({ example: 'ITEM-001' })
    @IsString()
    @IsNotEmpty()
    itemCode: string;

    @ApiProperty({ example: 'Paracetamol' })
    @IsString()
    @IsNotEmpty()
    itemName: string;

    @ApiProperty({ enum: InventoryType })
    @IsEnum(InventoryType)
    @IsNotEmpty()
    type: InventoryType;

    @ApiProperty({ example: 'Medicine' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ example: 100 })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ example: 'box' })
    @IsString()
    @IsNotEmpty()
    unit: string;

    @ApiProperty({ example: 10 })
    @IsNumber()
    @IsNotEmpty()
    unitCost: number;

    @ApiProperty({ example: 15 })
    @IsNumber()
    @IsNotEmpty()
    sellingPrice: number;

    @ApiPropertyOptional({ example: 'BATCH-2026' })
    @IsString()
    @IsOptional()
    batchNumber?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @ApiPropertyOptional({ example: 'Pharmacy' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional({ enum: InventoryStatus })
    @IsOptional()
    @IsEnum(InventoryStatus)
    status?: InventoryStatus;

    @ApiPropertyOptional({ example: 20 })
    @IsNumber()
    @IsOptional()
    minimumLevel?: number;

    @ApiPropertyOptional({ example: 'ABC Pharma' })
    @IsString()
    @IsOptional()
    supplier?: string;
}

export class UpdateInventoryDto extends CreateInventoryDto { }
