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
import { Patient } from '../../patients/entities/patient.entity';

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum VehicleType {
  BASIC_LIFE_SUPPORT = 'basic_life_support',
  ADVANCED_LIFE_SUPPORT = 'advanced_life_support',
  PATIENT_TRANSPORT = 'patient_transport',
  NEONATAL = 'neonatal',
}

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  ON_TRIP = 'on_trip',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum TripType {
  EMERGENCY = 'emergency',
  SCHEDULED = 'scheduled',
  INTER_FACILITY = 'inter_facility',
  DEAD_BODY = 'dead_body',
}

export enum TripStatus {
  DISPATCHED = 'dispatched',
  EN_ROUTE_PICKUP = 'en_route_pickup',
  PATIENT_PICKED = 'patient_picked',
  EN_ROUTE_HOSPITAL = 'en_route_hospital',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

// ── Ambulance (fleet vehicle) ──────────────────────────────────────────────────

/**
 * Represents a single ambulance vehicle in the organization's fleet.
 * Vehicle numbers are unique per organization.
 */
@Entity('ambulances')
@Index(['organizationId', 'vehicleNumber'], { unique: true })
@Index(['organizationId', 'status'])
export class Ambulance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  /**
   * Vehicle registration number — unique within the organization.
   * e.g. "MH-12-AB-1234"
   */
  @Column({ length: 50 })
  vehicleNumber: string;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ length: 200 })
  driverName: string;

  @Column({ length: 20 })
  driverPhone: string;

  @Column({
    type: 'enum',
    enum: AmbulanceStatus,
    default: AmbulanceStatus.AVAILABLE,
  })
  @Index()
  status: AmbulanceStatus;

  /**
   * Last known GPS location or landmark description.
   * Updated by the dispatcher or driver app.
   */
  @Column({ nullable: true })
  currentLocation: string;

  /**
   * Free-text list of onboard medical equipment.
   * e.g. "Defibrillator, Oxygen cylinder, ECG monitor, IV stand"
   */
  @Column({ type: 'text', nullable: true })
  equipmentList: string;

  /** Date of the most recent preventive maintenance service. */
  @Column({ type: 'date', nullable: true })
  lastServiceDate: Date;

  /** Insurance policy expiry date — alerts should be raised before this lapses. */
  @Column({ type: 'date', nullable: true })
  insuranceExpiry: Date;

  /** Fitness certificate expiry — mandatory for road-worthiness in many jurisdictions. */
  @Column({ type: 'date', nullable: true })
  fitnessExpiry: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<Ambulance>) {
    Object.assign(this, partial);
  }
}

// ── AmbulanceTrip ──────────────────────────────────────────────────────────────

/**
 * Represents a single dispatch/trip event for an ambulance.
 * Trip numbers are auto-generated in the format TRIP-YYYYMMDD-NNN.
 *
 * patientId is nullable to support walk-in / unidentified callers.
 * emergencyCaseId is a plain UUID column (no FK) to avoid a circular
 * module dependency between the ambulance and emergency modules.
 */
@Entity('ambulance_trips')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'ambulanceId'])
@Index(['organizationId', 'tripNumber'], { unique: true })
@Index(['organizationId', 'patientId'])
@Index(['organizationId', 'dispatchTime'])
export class AmbulanceTrip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  ambulanceId: string;

  @ManyToOne(() => Ambulance, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ambulanceId' })
  ambulance: Ambulance;

  /**
   * Auto-generated on dispatch. Format: TRIP-YYYYMMDD-NNN
   * e.g. TRIP-20260312-001
   */
  @Column()
  tripNumber: string;

  /**
   * Linked to an existing patient record when known.
   * Null for walk-in callers or unidentified patients.
   */
  @Column({ nullable: true })
  patientId: string;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  /**
   * Name of the patient as provided at dispatch time.
   * Required even when patientId is supplied — acts as the snapshot name
   * so the record remains readable if the patient record is later edited.
   */
  @Column()
  patientName: string;

  @Column({ nullable: true })
  patientContact: string;

  @Column({ type: 'text' })
  pickupLocation: string;

  @Column({ type: 'text' })
  dropLocation: string;

  @Column({ type: 'enum', enum: TripType })
  tripType: TripType;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.DISPATCHED,
  })
  @Index()
  status: TripStatus;

  @Column({ type: 'enum', enum: TripPriority, default: TripPriority.NORMAL })
  priority: TripPriority;

  /** Timestamp when the trip was first dispatched. */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dispatchTime: Date;

  /** Set when the driver reaches the pickup location (EN_ROUTE_PICKUP → PATIENT_PICKED). */
  @Column({ type: 'timestamp', nullable: true })
  pickupTime: Date;

  /** Set when the ambulance arrives at the drop (hospital/destination). */
  @Column({ type: 'timestamp', nullable: true })
  arrivalTime: Date;

  /** Set when trip status transitions to COMPLETED or CANCELLED. */
  @Column({ type: 'timestamp', nullable: true })
  completionTime: Date;

  /** Distance travelled in kilometres. Filled on trip completion. */
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distance: number;

  /** Fare charged for the trip (in the organization's local currency). */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fare: number;

  @Column({ type: 'text', nullable: true })
  driverNotes: string;

  /**
   * Reference to an EmergencyCase if this trip originated from the ED.
   * Stored as a plain UUID column — no FK to avoid circular module dependency.
   */
  @Column({ nullable: true })
  emergencyCaseId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial: Partial<AmbulanceTrip>) {
    Object.assign(this, partial);
  }
}
