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
    @Index()
    subscriptionId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'INR' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    @Index()
    status: PaymentStatus;

    @Column({ length: 50, nullable: true })
    paymentMethod: string;

    // e.g. Razorpay/Stripe Payment ID
    @Column({ length: 255, unique: true, nullable: true })
    @Index()
    gatewayTransactionId: string;

    @Column({ length: 500, nullable: true })
    invoiceUrl: string;

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
