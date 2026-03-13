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

@Entity('medicines')
@Index(['medicineCode'])
@Index(['name'])
@Index(['stock'])
@Index(['organizationId'])
@Index(['organizationId', 'name'])
@Index(['organizationId', 'expiryDate'])
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ length: 50, unique: true })
  medicineCode: string; // e.g., MED-001

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  genericName: string;

  @Column({ length: 100 })
  strength: string; // e.g., "500mg", "10ml"

  @Column({ length: 100 })
  formulation: string; // 'Tablet', 'Capsule', 'Syrup', 'Injection', etc.

  @Column({ length: 255, nullable: true })
  manufacturer: string;

  @Column({ length: 50, nullable: true })
  batchNumber: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sellingPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ default: 50 })
  reorderLevel: number;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column('text', { array: true, default: [] })
  sideEffects: string[];

  @Column('text', { array: true, default: [] })
  contraindications: string[];

  @Column('text', { nullable: true })
  storageConditions: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  constructor(partial: Partial<Medicine>) {
    Object.assign(this, partial);
  }
}
