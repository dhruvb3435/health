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

export enum InventoryType {
  MEDICINE = 'medicine',
  EQUIPMENT = 'equipment',
  SUPPLIES = 'supplies',
  DIAGNOSTIC_KIT = 'diagnostic_kit',
}

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

@Entity('inventory')
@Index(['itemCode'])
@Index(['type'])
@Index(['status'])
@Index(['organizationId'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ unique: true })
  itemCode: string;

  @Column()
  itemName: string;

  @Column({ type: 'enum', enum: InventoryType })
  type: InventoryType;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column()
  unit: string; // mg, ml, box, piece, etc.

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  sellingPrice: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  manufacturerId: string;

  @Column({ nullable: true })
  manufacturerName: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  location: string; // Store/Ward location

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.IN_STOCK })
  status: InventoryStatus;

  @Column({ default: 10 })
  minimumLevel: number; // Reorder level

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
