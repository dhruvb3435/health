import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';

export enum OrganizationStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
    TRIAL = 'trial',
    EXPIRED = 'expired',
}

export enum SubscriptionPlan {
    BASIC = 'basic',
    PREMIUM = 'premium',
    ENTERPRISE = 'enterprise',
}

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    @Index()
    slug: string;

    @Column({ nullable: true })
    logoUrl: string;

    // Replaced by SubscriptionsModule's true Subscription entity
    // SubscriptionPlan column removed.

    @Column({
        type: 'enum',
        enum: OrganizationStatus,
        default: OrganizationStatus.PENDING,
    })
    status: OrganizationStatus;

    @Column({ type: 'jsonb', nullable: true })
    settings: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    constructor(partial: Partial<Organization>) {
        Object.assign(this, partial);
    }
}
