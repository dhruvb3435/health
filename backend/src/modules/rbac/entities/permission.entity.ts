import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // e.g., 'patients:read', 'billing:manage'

    @Column({ nullable: true })
    description: string;

    @Column()
    category: string; // e.g., 'Patients', 'Inventory', 'System'

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
