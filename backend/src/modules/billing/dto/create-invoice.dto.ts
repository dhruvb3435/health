import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString, ValidateNested, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';

class LineItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @IsNumber()
    unitPrice: number;

    @ApiProperty()
    @IsNumber()
    totalPrice: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    category: string;
}

export class CreateInvoiceDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    invoiceNumber: string;

    @ApiProperty({ type: [LineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LineItemDto)
    lineItems: LineItemDto[];

    @ApiProperty()
    @IsNumber()
    subtotal: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    taxAmount?: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    taxPercentage?: number;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiPropertyOptional({ enum: InvoiceStatus })
    @IsOptional()
    @IsEnum(InvoiceStatus)
    status?: InvoiceStatus;

    @ApiProperty()
    @IsDateString()
    issueDate: string;

    @ApiProperty()
    @IsDateString()
    dueDate: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateInvoiceDto extends CreateInvoiceDto { }
