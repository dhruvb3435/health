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
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TreatmentType {
  CASHLESS = 'cashless',
  REIMBURSEMENT = 'reimbursement',
}

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  QUERY_RAISED = 'query_raised',
  APPROVED = 'approved',
  PARTIALLY_APPROVED = 'partially_approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

// ---------------------------------------------------------------------------
// InsuranceProvider entity
// ---------------------------------------------------------------------------

@Entity('insurance_providers')
@Index(['organizationId', 'providerCode'], { unique: true })
@Index(['organizationId', 'isActive'])
export class InsuranceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ length: 200 })
  providerName: string;

  @Column({ length: 50, unique: true })
  providerCode: string;

  @Column({ length: 200, nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  panNumber: string;

  @Column({ nullable: true })
  gstNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<InsuranceProvider>) {
    Object.assign(this, partial);
  }
}

// ---------------------------------------------------------------------------
// InsuranceClaim entity
// ---------------------------------------------------------------------------

@Entity('insurance_claims')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'claimNumber'], { unique: true })
@Index(['organizationId', 'providerId'])
@Index(['organizationId', 'patientId'])
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Auto-generated on creation: CLM-YYYYMMDD-NNN (e.g. CLM-20240615-001)
   */
  @Column({ length: 50, unique: true })
  claimNumber: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  doctorId: string;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column()
  providerId: string;

  @ManyToOne(() => InsuranceProvider, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'providerId' })
  provider: InsuranceProvider;

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ length: 100 })
  policyNumber: string;

  @Column({ length: 200 })
  policyHolderName: string;

  /**
   * Relationship of the policy holder to the patient: self / spouse / child / parent
   */
  @Column({ nullable: true })
  relationToPatient: string;

  @Column({ type: 'date', nullable: true })
  admissionDate: Date;

  @Column({ type: 'date', nullable: true })
  dischargeDate: Date;

  /**
   * ICD-10 diagnosis code (e.g. J18.9 — Pneumonia, unspecified)
   */
  @Column({ nullable: true })
  diagnosisCode: string;

  @Column({ type: 'text' })
  diagnosisDescription: string;

  @Column({ type: 'enum', enum: TreatmentType })
  treatmentType: TreatmentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  claimAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  approvedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  settledAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductionAmount: number;

  @Column({ type: 'text', nullable: true })
  deductionReason: string;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.DRAFT,
  })
  status: ClaimStatus;

  @Column({ nullable: true })
  tpaReferenceNumber: string;

  @Column({ nullable: true })
  preAuthNumber: string;

  @Column({ type: 'date', nullable: true })
  preAuthDate: Date;

  @Column({ type: 'date', nullable: true })
  submittedDate: Date;

  @Column({ type: 'date', nullable: true })
  approvedDate: Date;

  @Column({ type: 'date', nullable: true })
  settledDate: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  queryDetails: string;

  /**
   * Array of attached documents: [{ name: string, url: string, type: string }]
   */
  @Column({ type: 'jsonb', nullable: true })
  documents: { name: string; url: string; type: string }[];

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<InsuranceClaim>) {
    Object.assign(this, partial);
  }
}
