import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

@Entity('wards')
@Index(['wardCode'])
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ unique: true })
  wardCode: string;

  @Column()
  wardName: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  totalBeds: number;

  @Column({ type: 'int', default: 0 })
  occupiedBeds: number;

  @Column({ type: 'int', default: 0 })
  maintenanceBeds: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerDay: number;

  @Column({ nullable: true })
  wardIncharge: string; // Staff ID

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  block: string;

  @Column({ type: 'text', nullable: true })
  facilities: string; // JSON array of facilities

  @Column({ nullable: true })
  remarks: string;

  @OneToMany(() => Bed, bed => bed.ward)
  beds: Bed[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

@Entity('beds')
@Index(['wardId'])
@Index(['bedNumber'])
@Index(['organizationId', 'wardId', 'status'])
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  wardId: string;

  @ManyToOne(() => Ward, ward => ward.beds, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wardId' })
  ward: Ward;

  @Column()
  bedNumber: string;

  @Column({ type: 'enum', enum: BedStatus, default: BedStatus.AVAILABLE })
  status: BedStatus;

  @Column({ nullable: true })
  assignedPatientId: string;

  @Column({ nullable: true })
  assignedDate: Date;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
