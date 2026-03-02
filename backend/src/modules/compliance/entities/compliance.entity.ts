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

export enum ComplianceType {
  HIPAA = 'hipaa',
  GDPR = 'gdpr',
  DATA_SECURITY = 'data_security',
  INFECTION_CONTROL = 'infection_control',
  PATIENT_RIGHTS = 'patient_rights',
  DOCUMENTATION = 'documentation',
  OTHER = 'other',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  UNDER_REMEDIATION = 'under_remediation',
}

@Entity('compliance_records')
@Index(['complianceType'])
@Index(['status'])
@Index(['organizationId'])
export class ComplianceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  recordId: string;

  @Column({ type: 'enum', enum: ComplianceType })
  complianceType: ComplianceType;

  @Column()
  description: string;

  @Column({ nullable: true })
  regulatoryBody: string; // e.g., "Ministry of Health"

  @Column({ type: 'enum', enum: ComplianceStatus, default: ComplianceStatus.PENDING_REVIEW })
  status: ComplianceStatus;

  @Column({ nullable: true })
  lastAuditDate: Date;

  @Column({ nullable: true })
  nextAuditDate: Date;

  @Column({ nullable: true })
  auditedBy: string; // Staff ID

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  actionItems: string;

  @Column({ nullable: true })
  targetComplianceDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('data_access_logs')
@Index(['userId'])
@Index(['timestamp'])
@Index(['organizationId'])
export class DataAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  userId: string;

  @Column()
  action: string; // "view", "edit", "delete", etc.

  @Column()
  entityType: string; // "patient", "prescription", "lab_test", etc.

  @Column()
  entityId: string;

  @Column()
  timestamp: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ nullable: true })
  status: string; // "success", "failed", etc.

  @CreateDateColumn()
  createdAt: Date;
}
