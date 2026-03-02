import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PENDING = 'pending',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  INSURANCE = 'insurance',
}

@Entity('invoices')
@Index(['organizationId', 'id'])
@Index(['organizationId', 'patientId'])
@Index(['organizationId', 'invoiceNumber'])
@Index(['organizationId', 'status'])
@Index(['organizationId', 'dueDate'])
@Index(['organizationId', 'createdAt'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column('jsonb')
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: string; // 'consultation', 'test', 'medicine', 'surgery', etc.
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number; // GST/VAT

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dueAmount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ type: 'timestamp' })
  issueDate: Date;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column('jsonb', { nullable: true })
  payments: {
    paymentId: string;
    amount: number;
    method: PaymentMethod;
    transactionId: string;
    paymentDate: Date;
    reference: string;
  }[];

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  insuranceClaimId: string;

  @Column({ nullable: true })
  pdfUrl: string; // S3 URL to generated PDF

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Invoice>) {
    Object.assign(this, partial);
  }
}
