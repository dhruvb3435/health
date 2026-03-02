import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { BillingCycle, SubscriptionPlanTier } from '../enums/subscription.enum';

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: SubscriptionPlanTier,
        unique: true
    })
    @Index()
    tier: SubscriptionPlanTier;

    @Column()
    name: string;

    @Column({ unique: true })
    @Index()
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ default: 'INR' })
    currency: string;

    @Column({
        type: 'enum',
        enum: BillingCycle,
        default: BillingCycle.MONTHLY,
    })
    billingCycle: BillingCycle;

    // Stripe or Razorpay Product Reference
    @Column({ nullable: true })
    productId: string;

    // Stripe or Razorpay Price Reference
    @Column({ nullable: true })
    priceId: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
