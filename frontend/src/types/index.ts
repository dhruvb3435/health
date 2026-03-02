export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient' | 'pharmacist' | 'lab_technician';

export const UserRoleEnum = {
  ADMIN: 'admin' as UserRole,
  DOCTOR: 'doctor' as UserRole,
  NURSE: 'nurse' as UserRole,
  RECEPTIONIST: 'receptionist' as UserRole,
  PATIENT: 'patient' as UserRole,
  PHARMACIST: 'pharmacist' as UserRole,
  LAB_TECHNICIAN: 'lab_technician' as UserRole,
};

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    organizationId: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  settings?: Record<string, unknown>;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: string;
  organizationId?: string;
}

// ── User ──

export interface User {
  id: string;
  userId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  roles: { id: string; name: string }[];
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Patient ──

export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export interface Patient {
  id: string;
  organizationId: string;
  user?: User;
  customUserId?: string;
  patientId?: string;
  bloodType?: BloodType;
  allergies: string[];
  chronicDiseases: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  height?: number;
  weight?: number;
  maritalStatus?: string;
  occupation?: string;
  createdAt: string;
  updatedAt: string;
}

// Backwards-compatible alias
export type PatientData = Patient;

// ── Doctor ──

export interface DoctorAvailableSlot {
  day: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface Doctor {
  id: string;
  organizationId: string;
  user?: User;
  customUserId?: string;
  doctorId?: string;
  specialization: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  registrationNumber?: string;
  qualifications: string[];
  certifications: string[];
  yearsOfExperience?: number;
  rating: number;
  totalConsultations: number;
  availableSlots?: DoctorAvailableSlot[];
  consultationFee: number;
  biography?: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Backwards-compatible alias
export type DoctorData = Doctor;

// ── Staff ──

export type StaffRole = 'doctor' | 'nurse' | 'technician' | 'receptionist' | 'admin' | 'pharmacist' | 'lab_technician';
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';

export interface Staff {
  id: string;
  organizationId: string;
  staffId: string;
  user?: User;
  userId: string;
  role: StaffRole;
  status: StaffStatus;
  specialization?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  departmentId?: string;
  department?: string;
  joiningDate?: string;
  qualification?: string;
  yearsOfExperience?: number;
  isVerified: boolean;
  availableFrom?: string;
  availableTo?: string;
  hireDate?: string;
  shift?: string;
  salary?: number;
  contractType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Appointment ──

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export interface Appointment {
  id: string;
  organizationId: string;
  patient?: Patient;
  patientId: string;
  patientName?: string;
  doctor?: Doctor;
  doctorId?: string;
  doctorName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  tokenNumber?: number;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  isVirtual: boolean;
  meetingLink?: string;
  reminderSent?: string;
  cancelledReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Backwards-compatible alias
export type AppointmentData = Appointment;

// ── Medicine ──

export interface Medicine {
  id: string;
  organizationId: string;
  medicineCode: string;
  name: string;
  genericName?: string;
  strength: string;
  formulation: string;
  manufacturer?: string;
  batchNumber?: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  expiryDate?: string;
  sideEffects: string[];
  contraindications: string[];
  storageConditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Ward & Bed ──

export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface Bed {
  id: string;
  organizationId: string;
  wardId: string;
  ward?: Ward;
  bedNumber: string;
  status: BedStatus;
  assignedPatientId?: string;
  assignedDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  organizationId: string;
  wardCode: string;
  wardName: string;
  description: string;
  totalBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  pricePerDay: number;
  wardIncharge?: string;
  floor?: string;
  block?: string;
  facilities?: string;
  remarks?: string;
  beds?: Bed[];
  createdAt: string;
  updatedAt: string;
}

// ── Surgery & Operation Theater ──

export type SurgeryStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

export interface OperationTheater {
  id: string;
  organizationId: string;
  theatreCode: string;
  theatreName: string;
  isAvailable: boolean;
  facilities?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Surgery {
  id: string;
  organizationId: string;
  surgeryId: string;
  patientId: string;
  patient?: Patient;
  surgeonId: string;
  surgeon?: Doctor;
  theatreId: string;
  theatre?: OperationTheater;
  surgeryType: string;
  status: SurgeryStatus;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  anesthetist?: string;
  assistants?: string;
  preOpNotes?: string;
  postOpNotes?: string;
  diagnosis?: string;
  procedure?: string;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Invoice & Payment ──

export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded' | 'pending';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'insurance';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

export interface InvoicePayment {
  paymentId: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  paymentDate: string;
  reference: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  patient?: Patient;
  patientId: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  payments?: InvoicePayment[];
  notes?: string;
  insuranceClaimId?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: SubscriptionPaymentStatus;
  paymentMethod?: string;
  gatewayTransactionId?: string;
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Inventory ──

export type InventoryType = 'medicine' | 'equipment' | 'supplies' | 'diagnostic_kit';
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'damaged';

export interface InventoryItem {
  id: string;
  organizationId: string;
  itemCode: string;
  itemName: string;
  type: InventoryType;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  batchNumber?: string;
  manufacturerId?: string;
  manufacturerName?: string;
  expiryDate?: string;
  location?: string;
  status: InventoryStatus;
  minimumLevel: number;
  supplier?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard ──

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  revenue: number;
}

export interface DashboardModuleMetrics {
  wards?: {
    totalWards?: number;
    totalBeds?: number;
    occupiedBeds?: number;
    availableBeds?: number;
  };
  financial?: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  lowStockItems: number;
  staffCount: number;
  nonCompliantItems: number;
}

// ── Compliance ──

export interface ComplianceItem {
  id: string;
  organizationId: string;
  recordId: string;
  complianceType: string;
  description: string;
  regulatoryBody?: string;
  status: string;
  lastAuditDate?: string;
  nextAuditDate?: string;
  auditedBy?: string;
  findings?: string;
  actionItems?: string;
  targetComplianceDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Data Access Log ──

export interface DataAccessLog {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress?: string;
  reason?: string;
  status?: string;
  createdAt: string;
}

// ── Prescription ──

export interface Prescription {
  id: string;
  organizationId: string;
  prescriptionNumber: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  status: string;
  medicines: {
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
  }[];
  diagnosis?: string;
  notes?: string;
  issuedDate: string;
  expiryDate?: string;
  isRecurring: boolean;
  isDigitallySigned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Admission ──

export interface Admission {
  id: string;
  organizationId: string;
  admissionId: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  wardId: string;
  ward?: Ward;
  bedId: string;
  bed?: Bed;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  reason?: string;
  diagnosis?: string;
  vitalsHistory: {
    timestamp: string;
    bp: string;
    pulse: number;
    temp: number;
    spO2: number;
    weight?: number;
    recordedBy: string;
  }[];
  nursingNotes: {
    timestamp: string;
    note: string;
    nurseId: string;
    nurseName: string;
  }[];
  dischargeSummary?: string;
  dischargePlan?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Lab Test ──

export interface LabTest {
  id: string;
  organizationId: string;
  patientId: string;
  patient?: Patient;
  doctorId?: string;
  doctor?: Doctor;
  testName: string;
  testCode?: string;
  category?: string;
  status: string;
  result?: string;
  normalRange?: string;
  unit?: string;
  sampleType?: string;
  sampleCollectedAt?: string;
  reportedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──

export type NotificationType = 'appointment' | 'billing' | 'system' | 'alert' | 'onboarding' | 'inventory';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ── Radiology Request ──

export type ImagingType = 'x_ray' | 'ct_scan' | 'mri' | 'ultrasound' | 'mammography';
export type RadiologyStatus = 'pending' | 'completed' | 'reported' | 'archived';

export interface RadiologyRequest {
  id: string;
  organizationId: string;
  requestId: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  imagingType: ImagingType;
  bodyPart: string;
  clinicalHistory?: string;
  status: RadiologyStatus;
  scheduledDate?: string;
  completedDate?: string;
  technicianId?: string;
  findings?: string;
  radiologistId?: string;
  reportNotes?: string;
  reportPath?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Paginated Response ──

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
