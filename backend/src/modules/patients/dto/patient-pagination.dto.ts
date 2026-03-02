import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PatientPaginationDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Filter by blood type (e.g. A+, O-)' })
    @IsOptional()
    @IsString()
    bloodType?: string;

    @ApiPropertyOptional({ description: 'Filter by gender (male, female, other)' })
    @IsOptional()
    @IsString()
    gender?: string;
}
