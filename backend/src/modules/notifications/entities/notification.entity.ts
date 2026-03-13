import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export type NotificationType = 'appointment' | 'billing' | 'system' | 'alert' | 'onboarding' | 'inventory';

@Entity('notifications')
@Index(['organizationId', 'isRead', 'createdAt'])
@Index(['userId', 'isRead'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'user_id', nullable: true })
    userId: string; // null = org-wide notification

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 50 })
    type: NotificationType;

    @Column({ length: 255 })
    title: string;

    @Column('text')
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    data: Record<string, any>; // extra payload: links, IDs, etc.

    @Column({ name: 'is_read', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    constructor(partial: Partial<Notification>) {
        Object.assign(this, partial);
    }
}
