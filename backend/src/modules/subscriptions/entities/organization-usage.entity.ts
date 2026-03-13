import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
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

    @Column({ name: 'feature_key', length: 100 })
    featureKey: string;

    @Column({ name: 'used_count', type: 'int', default: 0 })
    usedCount: number;

    @Column({ name: 'last_reset_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastResetAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
