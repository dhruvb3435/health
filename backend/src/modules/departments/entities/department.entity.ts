import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('departments')
@Index(['organizationId', 'name'], { unique: true })
@Index(['organizationId', 'isActive'])
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true, length: 500 })
  description: string;

  @Column({ length: 36, nullable: true })
  headOfDepartmentId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @Index()
  parentDepartmentId: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentDepartmentId' })
  parentDepartment: Department;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
