import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AppointmentPaginationDto extends PaginationQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    patientId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    doctorId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dateTo?: string;
}
