import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class MedicinePaginationDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Filter by formulation (Tablet, Capsule, Syrup, Injection, Ointment)' })
    @IsOptional()
    @IsString()
    formulation?: string;

    @ApiPropertyOptional({ description: 'Filter by stock status: "low" for low stock, "out" for out of stock' })
    @IsOptional()
    @IsString()
    stockFilter?: string;
}
