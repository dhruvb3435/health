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
import { Patient } from './patient.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('medical_records')
@Index(['organizationId', 'patientId'])
@Index(['organizationId'])
@Index(['patientId'])
@Index(['recordType'])
@Index(['createdAt'])
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Patient, (patient) => patient.medicalRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @Column()
  recordType: string; // 'consultation', 'diagnosis', 'test', 'surgery', etc.

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  findings: string;

  @Column({ nullable: true })
  diagnosis: string;

  @Column({ nullable: true })
  treatment: string;

  @Column({ nullable: true })
  doctorName: string;

  @Column({ nullable: true })
  doctorId: string;

  @Column('text', { array: true, default: [] })
  attachmentUrls: string[]; // S3 URLs to medical documents

  @Column({ nullable: true })
  visitDate: Date;

  @Column({ default: true })
  isConfidential: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<MedicalRecord>) {
    Object.assign(this, partial);
  }
}
