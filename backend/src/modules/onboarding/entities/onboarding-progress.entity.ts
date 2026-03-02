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
import { Organization } from '../../organizations/entities/organization.entity';

export type OnboardingStep = 'profile' | 'team' | 'demo' | 'modules' | 'complete';

@Entity('onboarding_progress')
@Index(['organizationId'], { unique: true })
export class OnboardingProgress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column({ type: 'int', default: 1 })
    currentStep: number;

    @Column({ type: 'jsonb', default: [] })
    completedSteps: OnboardingStep[];

    @Column({ default: false })
    isCompleted: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    constructor(partial: Partial<OnboardingProgress>) {
        Object.assign(this, partial);
    }
}
