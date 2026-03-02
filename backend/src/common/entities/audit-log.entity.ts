import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Organization } from '../../modules/organizations/entities/organization.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['entityType'])
@Index(['createdAt'])
@Index(['ipAddress'])
@Index(['organizationId', 'createdAt'])
@Index(['organizationId', 'userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userEmail: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column()
  entityType: string; // 'User', 'Patient', 'Appointment', etc.

  @Column({ nullable: true })
  entityId: string;

  @Column('jsonb', { nullable: true })
  changes: Record<string, any>; // Old vs new values

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
  }
}
