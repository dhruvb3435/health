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

export enum LabTestStatus {
  ORDERED = 'ordered',
  SAMPLE_COLLECTED = 'sample_collected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REPORTED = 'reported',
  CANCELLED = 'cancelled',
}

@Entity('lab_tests')
@Index(['patientId'])
@Index(['status'])
@Index(['orderedDate'])
@Index(['organizationId'])
export class LabTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @Column()
  testName: string;

  @Column({ nullable: true })
  testCode: string;

  @Column({
    type: 'enum',
    enum: LabTestStatus,
    default: LabTestStatus.ORDERED,
  })
  status: LabTestStatus;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  orderedBy: string; // Doctor name or ID

  @Column({ type: 'timestamp' })
  orderedDate: Date;

  @Column({ nullable: true })
  sampleCollectionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  @Column('jsonb', { nullable: true })
  testResults: {
    parameter: string;
    value: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];

  @Column('text', { nullable: true })
  interpretation: string;

  @Column({ nullable: true })
  reportedBy: string; // Lab technician name

  @Column({ nullable: true })
  reportPdfUrl: string; // S3 URL

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<LabTest>) {
    Object.assign(this, partial);
  }
}
