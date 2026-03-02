import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum SurgeryStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

@Entity('operation_theaters')
@Index(['theatreCode'])
@Index(['organizationId'])
export class OperationTheater {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ unique: true })
  theatreCode: string;

  @Column()
  theatreName: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  facilities: string; // JSON array

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('surgeries')
@Index(['patientId'])
@Index(['status'])
@Index(['organizationId'])
export class Surgery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  surgeryId: string;

  @Column()
  patientId: string;

  @Column()
  surgeonId: string;

  @Column()
  theatreId: string;

  @Column()
  surgeryType: string;

  @Column({ type: 'enum', enum: SurgeryStatus, default: SurgeryStatus.SCHEDULED })
  status: SurgeryStatus;

  @Column()
  scheduledDate: Date;

  @Column({ nullable: true })
  startTime: string; // HH:MM format

  @Column({ nullable: true })
  endTime: string;

  @Column({ nullable: true })
  anesthetist: string;

  @Column({ nullable: true })
  assistants: string; // JSON array of staff IDs

  @Column({ type: 'text', nullable: true })
  preOpNotes: string;

  @Column({ type: 'text', nullable: true })
  postOpNotes: string;

  @Column({ nullable: true })
  diagnosis: string;

  @Column({ nullable: true })
  procedure: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
