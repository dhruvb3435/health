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

    @Column()
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column({ nullable: true })
    userId: string; // null = org-wide notification

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ length: 50 })
    type: NotificationType;

    @Column({ length: 255 })
    title: string;

    @Column('text')
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    data: Record<string, any>; // extra payload: links, IDs, etc.

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    constructor(partial: Partial<Notification>) {
        Object.assign(this, partial);
    }
}
