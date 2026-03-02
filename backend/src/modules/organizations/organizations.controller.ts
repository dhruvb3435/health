import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new organization (System Admin only)' })
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
        return this.organizationsService.create(createOrganizationDto);
    }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all organizations' })
    findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get organization by ID' })
    findOne(@Param('id') id: string) {
        return this.organizationsService.findOne(id);
    }

    @Get('slug/:slug')
    @Public()
    @ApiOperation({ summary: 'Get organization by slug' })
    findBySlug(@Param('slug') slug: string) {
        return this.organizationsService.findBySlug(slug);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update organization' })
    update(
        @Param('id') id: string,
        @Body() updateOrganizationDto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(id, updateOrganizationDto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete organization' })
    remove(@Param('id') id: string) {
        return this.organizationsService.remove(id);
    }
}
