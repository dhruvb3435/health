import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Ward, Bed } from '../../wards/entities/ward.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum AdmissionStatus {
    ADMITTED = 'admitted',
    DISCHARGED = 'discharged',
    TRANSFER = 'transfer',
    CANCELLED = 'cancelled',
}

@Entity('admissions')
@Index(['admissionId'])
@Index(['status'])
@Index(['admissionDate'])
@Index(['organizationId', 'status'])
@Index(['organizationId', 'createdAt'])
export class Admission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column({ unique: true })
    admissionId: string; // ADM-001

    @Column()
    patientId: string;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    doctorId: string; // Admitting Doctor

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    wardId: string;

    @ManyToOne(() => Ward)
    @JoinColumn({ name: 'wardId' })
    ward: Ward;

    @Column()
    bedId: string;

    @ManyToOne(() => Bed)
    @JoinColumn({ name: 'bedId' })
    bed: Bed;

    @Column()
    admissionDate: Date;

    @Column({ nullable: true })
    dischargeDate: Date;

    @Column({
        type: 'enum',
        enum: AdmissionStatus,
        default: AdmissionStatus.ADMITTED,
    })
    status: AdmissionStatus;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ type: 'jsonb', default: [] })
    vitalsHistory: {
        timestamp: Date;
        bp: string;
        pulse: number;
        temp: number;
        spO2: number;
        weight?: number;
        recordedBy: string; // Nurse ID/Name
    }[];

    @Column({ type: 'jsonb', default: [] })
    nursingNotes: {
        timestamp: Date;
        note: string;
        nurseId: string;
        nurseName: string;
    }[];

    @Column({ type: 'text', nullable: true })
    dischargeSummary: string;

    @Column({ type: 'text', nullable: true })
    dischargePlan: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    constructor(partial: Partial<Admission>) {
        Object.assign(this, partial);
    }
}
