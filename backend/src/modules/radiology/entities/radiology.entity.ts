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

export enum ImagingType {
  X_RAY = 'x_ray',
  CT_SCAN = 'ct_scan',
  MRI = 'mri',
  ULTRASOUND = 'ultrasound',
  MAMMOGRAPHY = 'mammography',
}

export enum ImagingStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REPORTED = 'reported',
  ARCHIVED = 'archived',
}

@Entity('radiology_requests')
@Index(['patientId'])
@Index(['status'])
@Index(['organizationId'])
export class RadiologyRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  requestId: string;

  @Column()
  patientId: string;

  @Column()
  doctorId: string;

  @Column({ type: 'enum', enum: ImagingType })
  imagingType: ImagingType;

  @Column()
  bodyPart: string;

  @Column({ nullable: true })
  clinicalHistory: string;

  @Column({ type: 'enum', enum: ImagingStatus, default: ImagingStatus.PENDING })
  status: ImagingStatus;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  completedDate: Date;

  @Column({ nullable: true })
  technicianId: string;

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ nullable: true })
  radiologistId: string;

  @Column({ type: 'text', nullable: true })
  reportNotes: string;

  @Column({ nullable: true })
  reportPath: string; // S3 or file path

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
