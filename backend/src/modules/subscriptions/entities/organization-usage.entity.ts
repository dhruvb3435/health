import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('organization_usage')
@Index(['organizationId', 'featureKey'], { unique: true })
export class OrganizationUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id', type: 'uuid' })
    @Index()
    organizationId: string;

    @Column({ name: 'feature_key' })
    featureKey: string;

    @Column({ name: 'used_count', type: 'int', default: 0 })
    usedCount: number;

    @Column({ name: 'last_reset_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastResetAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
