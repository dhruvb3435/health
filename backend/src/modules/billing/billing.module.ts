import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { InvoiceRepository } from './repositories/invoice.repository';
import { CommonModule } from '../../common/common.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [CommonModule, SubscriptionsModule, TypeOrmModule.forFeature([Invoice, Payment]), MailModule],
  controllers: [BillingController],
  providers: [BillingService, InvoiceRepository],
  exports: [BillingService, TypeOrmModule],
})
export class BillingModule { }
