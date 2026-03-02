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
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum PrescriptionStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  ACTIVE = 'active',
  FULFILLED = 'fulfilled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('prescriptions')
@Index(['patientId'])
@Index(['doctorId'])
@Index(['status'])
@Index(['issuedDate'])
@Index(['organizationId', 'status'])
@Index(['organizationId', 'createdAt'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Patient, (patient) => patient.prescriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.prescriptions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  doctor: Doctor;

  @Column({ nullable: true })
  doctorId: string;

  @Column()
  prescriptionNumber: string; // Unique prescription number

  @Column({
    type: 'enum',
    enum: PrescriptionStatus,
    default: PrescriptionStatus.DRAFT,
  })
  status: PrescriptionStatus;

  @Column('jsonb')
  medicines: {
    medicineId: string;
    medicineName: string;
    dosage: string; // e.g., "500mg", "10ml"
    frequency: string; // e.g., "3 times a day", "Twice daily"
    duration: string; // e.g., "7 days", "2 weeks"
    instructions: string; // Special instructions
    quantity: number;
  }[];

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column({ type: 'timestamp' })
  issuedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringEndDate: Date;

  @Column({ default: false })
  isDigitallySigned: boolean;

  @Column({ nullable: true })
  digitalSignatureUrl: string; // S3 URL to signed PDF

  @Column({ nullable: true })
  pdfUrl: string; // S3 URL to generated PDF

  @Column('text', { array: true, default: [] })
  pharmacyNotified: string[]; // Pharmacy IDs notified

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Prescription>) {
    Object.assign(this, partial);
  }
}
