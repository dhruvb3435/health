import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

/**
 * ESI — Emergency Severity Index triage levels.
 * Level 1 = immediate resuscitation (most critical), Level 5 = non-urgent.
 * Ordering is numerically ascending so ORDER BY triageLevel ASC puts the
 * most critical cases first.
 */
export enum TriageLevel {
  LEVEL_1_RESUSCITATION = 'level_1_resuscitation',
  LEVEL_2_EMERGENCY = 'level_2_emergency',
  LEVEL_3_URGENT = 'level_3_urgent',
  LEVEL_4_SEMI_URGENT = 'level_4_semi_urgent',
  LEVEL_5_NON_URGENT = 'level_5_non_urgent',
}

export enum EmergencyStatus {
  REGISTERED = 'registered',
  TRIAGED = 'triaged',
  IN_TREATMENT = 'in_treatment',
  ADMITTED = 'admitted',
  DISCHARGED = 'discharged',
  TRANSFERRED = 'transferred',
  DECEASED = 'deceased',
}

export enum ArrivalMode {
  WALK_IN = 'walk_in',
  AMBULANCE = 'ambulance',
  POLICE = 'police',
  REFERRAL = 'referral',
}

export interface EmergencyVitals {
  bp: string;           // e.g. "120/80 mmHg"
  pulse: number;        // beats per minute
  temperature: number;  // degrees Celsius
  spO2: number;         // peripheral oxygen saturation (%)
  respiratoryRate: number; // breaths per minute
  gcs: number;          // Glasgow Coma Scale (3–15)
}

@Entity('emergency_cases')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'triageLevel'])
@Index(['organizationId', 'caseNumber'], { unique: true })
export class EmergencyCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Auto-generated on registration. Format: EMR-YYYYMMDD-NNN
   * e.g. EMR-20260312-001
   */
  @Column()
  caseNumber: string;

  /**
   * Nullable — patient may be unknown on arrival (e.g. unconscious, unidentified).
   * Can be linked later once the patient is identified.
   */
  @Column({ nullable: true })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  /**
   * Nullable — doctor may be assigned at triage or later during treatment.
   */
  @Column({ nullable: true })
  doctorId: string;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({
    type: 'enum',
    enum: TriageLevel,
    nullable: true,
  })
  @Index()
  triageLevel: TriageLevel;

  @Column({
    type: 'enum',
    enum: EmergencyStatus,
    default: EmergencyStatus.REGISTERED,
  })
  @Index()
  status: EmergencyStatus;

  @Column({
    type: 'enum',
    enum: ArrivalMode,
    default: ArrivalMode.WALK_IN,
  })
  arrivalMode: ArrivalMode;

  @Column({ type: 'text' })
  chiefComplaint: string;

  /**
   * Latest recorded vitals at triage or during treatment.
   * Stored as JSONB for flexible schema evolution.
   */
  @Column({ type: 'jsonb', nullable: true })
  vitals: EmergencyVitals;

  /**
   * Clinical injury/presentation category.
   * e.g. trauma, cardiac, respiratory, neurological, burns, poisoning, obstetric
   */
  @Column({ nullable: true })
  injuryType: string;

  @Column({ type: 'text', nullable: true })
  allergies: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ type: 'text', nullable: true })
  treatmentNotes: string;

  /**
   * Final disposition — what was done with the patient.
   * e.g. "Admitted to Ward 3 - Cardiology", "Discharged with prescription",
   * "Transferred to City Hospital ICU"
   */
  @Column({ nullable: true })
  disposition: string;

  /**
   * Reference to the Admission record if the patient was admitted from ED.
   * Stored as a plain UUID column — no FK constraint to avoid circular
   * module dependency between emergency and admissions.
   */
  @Column({ nullable: true })
  admissionId: string;

  // ── Timestamps ──────────────────────────────────────────────────────────

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  arrivalTime: Date;

  /** Set when triageLevel and vitals are first recorded. */
  @Column({ type: 'timestamp', nullable: true })
  triageTime: Date;

  /** Set when status transitions to in_treatment. */
  @Column({ type: 'timestamp', nullable: true })
  treatmentStartTime: Date;

  /** Set when status transitions to discharged, transferred, admitted, or deceased. */
  @Column({ type: 'timestamp', nullable: true })
  dispositionTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<EmergencyCase>) {
    Object.assign(this, partial);
  }
}
