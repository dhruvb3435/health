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
import { Plan } from './plan.entity';
import { ResetInterval } from '../enums/subscription.enum';

@Entity('feature_limits')
@Index(['planId', 'featureKey'], { unique: true })
export class FeatureLimit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Plan)
    @JoinColumn({ name: 'planId' })
    plan: Plan;

    @Column({ type: 'uuid' })
    planId: string;

    @Column()
    featureKey: string;

    // e.g. 1000 MAX_PATIENTS. Use -1 or null for unlimited. Use 1 for ON/OFF.
    @Column({ type: 'int', nullable: true })
    limitValue: number;

    @Column({ default: true })
    isEnabled: boolean;

    @Column({
        type: 'enum',
        enum: ResetInterval,
        default: ResetInterval.LIFETIME,
    })
    resetInterval: ResetInterval;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
