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

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

@Entity('appointments')
@Index(['organizationId', 'id'])
@Index(['organizationId', 'patientId'])
@Index(['organizationId', 'doctorId'])
@Index(['organizationId', 'appointmentDate'])
@Index(['organizationId', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Patient, (patient) => patient.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  doctor: Doctor;

  @Column({ nullable: true })
  doctorId: string;

  @Column({ type: 'timestamp' })
  appointmentDate: Date;

  @Column()
  appointmentTime: string; // HH:MM format

  @Column({ nullable: true })
  duration: number; // in minutes

  @Column({ type: 'int', nullable: true })
  tokenNumber: number;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  reason: string; // Chief complaint or reason for visit

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column('text', { nullable: true })
  treatment: string;

  @Column({ default: false })
  isVirtual: boolean;

  @Column({ nullable: true })
  meetingLink: string; // For virtual consultations

  @Column({ nullable: true })
  reminderSent: Date; // When reminder was sent

  @Column({ nullable: true })
  cancelledReason: string;

  @Column({ nullable: true })
  cancelledBy: string; // User ID of who cancelled

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Appointment>) {
    Object.assign(this, partial);
  }
}
