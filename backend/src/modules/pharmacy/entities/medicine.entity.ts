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

  @Column({ unique: true })
  medicineCode: string; // e.g., MED-001

  @Column()
  name: string;

  @Column({ nullable: true })
  genericName: string;

  @Column()
  strength: string; // e.g., "500mg", "10ml"

  @Column()
  formulation: string; // 'Tablet', 'Capsule', 'Syrup', 'Injection', etc.

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
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
