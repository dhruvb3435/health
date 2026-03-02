import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';

@Entity('doctors')
@Index(['organizationId', 'id'])
@Index(['organizationId', 'customUserId'])
@Index(['organizationId', 'specialization'])
@Index(['organizationId', 'licenseNumber'])
@Index(['organizationId', 'isActive'])
@Index(['organizationId', 'createdAt'])
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ name: 'custom_user_id' })
  customUserId: string;

  @Column({ nullable: true })
  doctorId: string; // Custom ID (e.g., DOC-001)

  @Column()
  specialization: string; // 'Cardiology', 'Pediatrics', etc.

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseExpiry: Date;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column('text', { array: true, default: [] })
  qualifications: string[];

  @Column('text', { array: true, default: [] })
  certifications: string[];

  @Column({ nullable: true })
  yearsOfExperience: number;

  @Column({ type: 'float', default: 0 })
  rating: number; // 0-5

  @Column({ default: 0 })
  totalConsultations: number;

  @Column({ type: 'json', nullable: true })
  availableSlots: {
    day: string; // 'Monday', 'Tuesday', etc.
    startTime: string; // '09:00'
    endTime: string; // '17:00'
    slotDuration: number; // in minutes (30, 60)
  }[];

  @Column({ default: 0 })
  consultationFee: number;

  @Column({ nullable: true })
  biography: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => Prescription, (prescription) => prescription.doctor)
  prescriptions: Prescription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Doctor>) {
    Object.assign(this, partial);
  }
}
