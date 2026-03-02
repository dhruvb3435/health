import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
    @ApiPropertyOptional({
        minimum: 1,
        default: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({
        minimum: 1,
        maximum: 100,
        default: 20,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 20;

    @ApiPropertyOptional()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
