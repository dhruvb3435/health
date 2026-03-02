import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
    ) { }

    async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
        const existing = await this.organizationRepository.findOne({
            where: { slug: createOrganizationDto.slug },
        });
        if (existing) {
            throw new ConflictException('Organization with this slug already exists');
        }

        const organization = this.organizationRepository.create(createOrganizationDto);
        return this.organizationRepository.save(organization);
    }

    async findAll(): Promise<Organization[]> {
        return this.organizationRepository.find();
    }

    async findOne(id: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({ where: { id } });
        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }
        return organization;
    }

    async findBySlug(slug: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOne({ where: { slug } });
        if (!organization) {
            throw new NotFoundException(`Organization with slug ${slug} not found`);
        }
        return organization;
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
        const organization = await this.findOne(id);
        Object.assign(organization, updateOrganizationDto);
        return this.organizationRepository.save(organization);
    }

    async remove(id: string): Promise<void> {
        const organization = await this.findOne(id);
        await this.organizationRepository.softRemove(organization);
    }
}
