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
import { MedicalRecord } from './medical-record.entity';
import { Prescription } from '../../prescriptions/entities/prescription.entity';

export enum BloodType {
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
}

@Entity('patients')
@Index(['organizationId', 'id'])
@Index(['organizationId', 'customUserId'])
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'bloodType'])
export class Patient {
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

  @Column({ name: 'custom_user_id', nullable: true })
  customUserId: string;

  @Column({ nullable: true })
  patientId: string; // Custom patient ID (e.g., PAT-001)

  @Column({ nullable: true })
  ssn: string; // Social Security Number (encrypted)

  @Column({
    type: 'enum',
    enum: BloodType,
    nullable: true,
  })
  bloodType: BloodType;

  @Column('text', { array: true, default: [] })
  allergies: string[];

  @Column('text', { array: true, default: [] })
  chronicDiseases: string[];

  @Column({ nullable: true })
  insuranceProvider: string;

  @Column({ nullable: true })
  insurancePolicyNumber: string;

  @Column({ nullable: true })
  insuranceExpiry: Date;

  @Column({ nullable: true })
  emergencyContactName: string;

  @Column({ nullable: true })
  emergencyContactPhone: string;

  @Column({ nullable: true })
  emergencyContactRelation: string;

  @Column({ type: 'float', nullable: true })
  height: number; // in cm

  @Column({ type: 'float', nullable: true })
  weight: number; // in kg

  @Column({ nullable: true })
  maritalStatus: string;

  @Column({ nullable: true })
  occupation: string;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (record) => record.patient)
  medicalRecords: MedicalRecord[];

  @OneToMany(() => Prescription, (prescription) => prescription.patient)
  prescriptions: Prescription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Patient>) {
    Object.assign(this, partial);
  }
}
