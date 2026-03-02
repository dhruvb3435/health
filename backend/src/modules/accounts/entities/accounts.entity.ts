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
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  expenseId: string;

  @Column({ type: 'enum', enum: ExpenseType })
  expenseType: ExpenseType;

  @Column()
  description: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  vendorName: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column()
  expenseDate: Date;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
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
export class Revenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  revenueId: string;

  @Column()
  source: string; // patient_fees, insurance, consultation, etc.

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  date: Date;

  @Column({ nullable: true })
  patientId: string;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
