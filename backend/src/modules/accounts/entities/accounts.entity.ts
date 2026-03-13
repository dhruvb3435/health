import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum ExpenseType {
  SALARY = 'salary',
  SUPPLIES = 'supplies',
  UTILITIES = 'utilities',
  MAINTENANCE = 'maintenance',
  EQUIPMENT = 'equipment',
  RENT = 'rent',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('expenses')
@Index(['expenseType'])
@Index(['status'])
@Index(['organizationId'])
@Index(['organizationId', 'status'])
@Index(['organizationId', 'expenseDate'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ length: 50 })
  expenseId: string;

  @Column({ type: 'enum', enum: ExpenseType })
  expenseType: ExpenseType;

  @Column({ length: 500 })
  description: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 255 })
  vendorName: string;

  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

  @Column()
  expenseDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ length: 36, nullable: true })
  approvedBy: string; // Admin ID

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('revenue')
@Index(['source'])
@Index(['organizationId'])
@Index(['organizationId', 'source'])
@Index(['organizationId', 'date'])
export class Revenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ length: 50 })
  revenueId: string;

  @Column({ length: 100 })
  source: string; // patient_fees, insurance, consultation, etc.

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @Column({ nullable: true })
  patientId: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ length: 500, nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
