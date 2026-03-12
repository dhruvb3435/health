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
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
}

export enum BloodComponent {
  WHOLE_BLOOD = 'whole_blood',
  PACKED_RBC = 'packed_rbc',
  PLATELETS = 'platelets',
  PLASMA = 'plasma',
  CRYOPRECIPITATE = 'cryoprecipitate',
}

export enum InventoryStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  ISSUED = 'issued',
  EXPIRED = 'expired',
  DISCARDED = 'discarded',
}

export enum RequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('blood_inventory')
@Index(['organizationId', 'bloodGroup', 'status'])
@Index(['organizationId', 'bagNumber'])
@Index(['organizationId', 'expiryDate'])
export class BloodInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'enum', enum: BloodGroup })
  bloodGroup: BloodGroup;

  @Column({ type: 'enum', enum: BloodComponent })
  component: BloodComponent;

  @Column({ type: 'int' })
  units: number;

  @Column({ unique: true })
  bagNumber: string;

  @Column({ type: 'date' })
  collectedDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  status: InventoryStatus;

  @Column()
  donorName: string;

  @Column({ nullable: true })
  donorContact: string;

  @Column({ type: 'int', nullable: true })
  donorAge: number;

  @Column({ nullable: true })
  crossMatchResult: string;

  @Column({ nullable: true })
  storageLocation: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<BloodInventory>) {
    Object.assign(this, partial);
  }
}

@Entity('blood_requests')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'bloodGroup', 'status'])
@Index(['organizationId', 'patientId'])
@Index(['organizationId', 'requestDate'])
export class BloodRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  doctorId: string;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'enum', enum: BloodGroup })
  bloodGroup: BloodGroup;

  @Column({ type: 'enum', enum: BloodComponent })
  component: BloodComponent;

  @Column({ type: 'int' })
  unitsRequested: number;

  @Column({ type: 'int', default: 0 })
  unitsIssued: number;

  @Column({ type: 'enum', enum: RequestPriority, default: RequestPriority.ROUTINE })
  priority: RequestPriority;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  requiredDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  issuedDate: Date;

  @Column()
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<BloodRequest>) {
    Object.assign(this, partial);
  }
}
