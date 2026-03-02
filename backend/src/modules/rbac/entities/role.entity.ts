import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
    Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Permission } from './permission.entity';

@Entity('roles')
@Index(['organizationId', 'name'], { unique: true })
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    organizationId: string;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column({ default: false })
    isSystemRole: boolean;

    @ManyToMany(() => Permission)
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    })
    permissions: Permission[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
