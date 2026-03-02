export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

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
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('payments')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'createdAt'])
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @ManyToOne(() => Subscription, { nullable: true })
    @JoinColumn({ name: 'subscriptionId' })
    subscription: Subscription;

    @Column({ type: 'uuid', nullable: true })
    subscriptionId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'INR' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    @Index()
    status: PaymentStatus;

    @Column({ nullable: true })
    paymentMethod: string;

    // e.g. Razorpay/Stripe Payment ID
    @Column({ nullable: true, unique: true })
    @Index()
    gatewayTransactionId: string;

    @Column({ nullable: true })
    invoiceUrl: string;

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
