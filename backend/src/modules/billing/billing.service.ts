import { Injectable, NotFoundException } from '@nestjs/common';
import { Invoice } from './entities/invoice.entity';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceRepository } from './repositories/invoice.repository';
import { TenantService } from '../../common/services/tenant.service';
import { MailService } from '../mail/mail.service';
import { InvoiceStatus } from './entities/invoice.entity';

@Injectable()
export class BillingService {
    constructor(
        private readonly invoiceRepository: InvoiceRepository,
        private readonly tenantService: TenantService,
        private readonly mailService: MailService,
    ) { }

    async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<Invoice>> {
        const searchFields = ['invoiceNumber'];
        return this.invoiceRepository.findPaginated(query, ['patient', 'patient.user'], searchFields);
    }

    async findOne(id: string) {
        const invoice = await this.invoiceRepository.findById(id);

        if (!invoice) {
            throw new NotFoundException(`Invoice with ID ${id} not found`);
        }

        return invoice;
    }

    async create(createInvoiceDto: CreateInvoiceDto) {
        const organizationId = this.tenantService.getTenantId();
        const invoice = this.invoiceRepository.create({
            ...createInvoiceDto,
            dueAmount: createInvoiceDto.totalAmount, // Initially, full amount is due
            organizationId,
        });
        const savedInvoice = await this.invoiceRepository.save(invoice);

        if (savedInvoice.status === InvoiceStatus.ISSUED) {
            const detailedInvoice = await this.invoiceRepository.findById(savedInvoice.id);
            if (detailedInvoice) {
                await this.mailService.sendInvoiceNotification(detailedInvoice);
            }
        }

        return savedInvoice;
    }

    async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
        const invoice = await this.findOne(id);
        const oldStatus = invoice.status;
        Object.assign(invoice, updateInvoiceDto);
        const savedInvoice = await this.invoiceRepository.save(invoice);

        if (oldStatus !== InvoiceStatus.ISSUED && savedInvoice.status === InvoiceStatus.ISSUED) {
            const detailedInvoice = await this.invoiceRepository.findById(savedInvoice.id);
            if (detailedInvoice) {
                await this.mailService.sendInvoiceNotification(detailedInvoice);
            }
        }

        return savedInvoice;
    }

    async remove(id: string) {
        const invoice = await this.findOne(id);
        return this.invoiceRepository.remove(invoice);
    }
}
