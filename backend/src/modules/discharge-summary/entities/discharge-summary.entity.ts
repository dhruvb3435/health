import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum DischargeType {
    NORMAL = 'normal',
    AGAINST_ADVICE = 'against_advice',
    ABSCONDED = 'absconded',
    REFERRED = 'referred',
    EXPIRED = 'expired',
}

export enum DischargeStatus {
    DRAFT = 'draft',
    PENDING_APPROVAL = 'pending_approval',
    APPROVED = 'approved',
    COMPLETED = 'completed',
}

@Entity('discharge_summaries')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'summaryNumber'], { unique: true })
export class DischargeSummary {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    organizationId: string;

    @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @Column({ length: 50 })
    summaryNumber: string;

    @Column()
    patientId: string;

    @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    doctorId: string;

    @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column({ nullable: true })
    admissionId: string;

    @Column({ type: 'date' })
    admissionDate: string;

    @Column({ type: 'date' })
    dischargeDate: string;

    @Column({ type: 'enum', enum: DischargeType, default: DischargeType.NORMAL })
    dischargeType: DischargeType;

    @Column({ type: 'enum', enum: DischargeStatus, default: DischargeStatus.DRAFT })
    status: DischargeStatus;

    @Column({ type: 'text' })
    diagnosisAtAdmission: string;

    @Column({ type: 'text', nullable: true })
    diagnosisAtDischarge: string;

    @Column({ type: 'text', nullable: true })
    chiefComplaints: string;

    @Column({ type: 'text', nullable: true })
    historyOfPresentIllness: string;

    @Column({ type: 'text', nullable: true })
    pastHistory: string;

    @Column({ type: 'text', nullable: true })
    examinationFindings: string;

    @Column({ type: 'jsonb', nullable: true })
    investigationsPerformed: { name: string; result: string; date: string }[];

    @Column({ type: 'text', nullable: true })
    treatmentGiven: string;

    @Column({ type: 'text', nullable: true })
    proceduresPerformed: string;

    @Column({ type: 'text', nullable: true })
    courseInHospital: string;

    @Column({ type: 'text', nullable: true })
    conditionAtDischarge: string;

    @Column({ type: 'jsonb', nullable: true })
    dischargeMedications: { medicine: string; dosage: string; frequency: string; duration: string; instructions: string }[];

    @Column({ type: 'text', nullable: true })
    dietaryAdvice: string;

    @Column({ type: 'text', nullable: true })
    activityRestrictions: string;

    @Column({ type: 'date', nullable: true })
    followUpDate: string;

    @Column({ type: 'text', nullable: true })
    followUpInstructions: string;

    @Column({ type: 'text', nullable: true })
    emergencyInstructions: string;

    @Column({ type: 'text', nullable: true })
    referralDetails: string;

    @Column({ nullable: true })
    approvedById: string;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
