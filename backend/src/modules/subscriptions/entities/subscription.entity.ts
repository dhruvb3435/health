import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    OneToOne
} from 'typeorm';
import { Plan } from './plan.entity';
import { SubscriptionStatus } from '../enums/subscription.enum';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('subscriptions')
@Index(['organizationId', 'status'])
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // We are not using a direct relation to Organization here to avoid circular dependencies
    // since Organizations is a different module. We'll store the ID.
    @Column({ type: 'uuid', unique: true })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @ManyToOne(() => Plan)
    @JoinColumn({ name: 'planId' })
    plan: Plan;

    @Column({ type: 'uuid' })
    planId: string;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.TRIAL,
    })
    @Index()
    status: SubscriptionStatus;

    @Column({ type: 'timestamp', nullable: true })
    trialStartDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    trialEndDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodEnd: Date;

    @Column({ default: false })
    cancelAtPeriodEnd: boolean;

    @Column({ nullable: true })
    gatewaySubscriptionId: string;

    @Column({ nullable: true })
    gatewayCustomerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
