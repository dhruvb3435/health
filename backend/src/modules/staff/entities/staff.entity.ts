import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Department } from '../../departments/entities/department.entity';

export enum StaffRole {
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  TECHNICIAN = 'technician',
  RECEPTIONIST = 'receptionist',
  ADMIN = 'admin',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
}

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
}

@Entity('staff')
@Index(['userId'])
@Index(['staffId'])
@Index(['status'])
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ unique: true })
  staffId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status: StaffStatus;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseExpiry: Date;

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  joiningDate: Date;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  yearsOfExperience: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  availableFrom: string; // HH:MM format

  @Column({ nullable: true })
  availableTo: string; // HH:MM format

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
