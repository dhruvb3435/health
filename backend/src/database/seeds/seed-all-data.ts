import { AppDataSource } from '../typeorm.config';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import { Patient } from '../../modules/patients/entities/patient.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import { Appointment, AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';
import { Prescription } from '../../modules/prescriptions/entities/prescription.entity';
import { Medicine } from '../../modules/pharmacy/entities/medicine.entity';
import { LabTest, LabTestStatus } from '../../modules/laboratory/entities/lab-test.entity';
import { Invoice, InvoiceStatus } from '../../modules/billing/entities/invoice.entity';
import { Expense, ExpenseType, PaymentStatus } from '../../modules/accounts/entities/accounts.entity';
import { Revenue } from '../../modules/accounts/entities/accounts.entity';
import { Staff, StaffRole, StaffStatus } from '../../modules/staff/entities/staff.entity';
import { Ward, Bed, BedStatus } from '../../modules/wards/entities/ward.entity';
import { Inventory, InventoryType, InventoryStatus } from '../../modules/inventory/entities/inventory.entity';
import { RadiologyRequest, ImagingType, ImagingStatus } from '../../modules/radiology/entities/radiology.entity';
import { OperationTheater, Surgery, SurgeryStatus } from '../../modules/operation-theater/entities/operation-theater.entity';
import { ComplianceRecord, ComplianceStatus, ComplianceType } from '../../modules/compliance/entities/compliance.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const DOCTORS_DATA = [
  { name: 'Dr. Rajesh Kumar', specialization: 'Cardiology', phone: '9876543210' },
  { name: 'Dr. Priya Singh', specialization: 'Orthopedics', phone: '9876543211' },
  { name: 'Dr. Amit Patel', specialization: 'Neurology', phone: '9876543212' },
  { name: 'Dr. Neha Sharma', specialization: 'Pediatrics', phone: '9876543213' },
  { name: 'Dr. Vikram Desai', specialization: 'General Surgery', phone: '9876543214' },
];

const PATIENTS_DATA = [
  { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '9111111111', age: 45 },
  { name: 'Deepak Gupta', email: 'deepak@example.com', phone: '9222222222', age: 38 },
  { name: 'Sneha Kapoor', email: 'sneha@example.com', phone: '9333333333', age: 32 },
  { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9444444444', age: 55 },
  { name: 'Pooja Nair', email: 'pooja@example.com', phone: '9555555555', age: 28 },
  { name: 'Sanjay Rao', email: 'sanjay@example.com', phone: '9666666666', age: 62 },
  { name: 'Anjali Reddy', email: 'anjali@example.com', phone: '9777777777', age: 35 },
  { name: 'Rohan Iyer', email: 'rohan@example.com', phone: '9888888888', age: 41 },
];

const MEDICINES_DATA = [
  { name: 'Aspirin', dosage: '500mg', price: 150, stock: 500 },
  { name: 'Amoxicillin', dosage: '250mg', price: 200, stock: 300 },
  { name: 'Metformin', dosage: '500mg', price: 180, stock: 400 },
  { name: 'Atorvastatin', dosage: '10mg', price: 250, stock: 250 },
  { name: 'Lisinopril', dosage: '5mg', price: 220, stock: 280 },
  { name: 'Omeprazole', dosage: '20mg', price: 190, stock: 320 },
  { name: 'Ibuprofen', dosage: '400mg', price: 100, stock: 600 },
  { name: 'Paracetamol', dosage: '500mg', price: 80, stock: 800 },
];

const LAB_TESTS_DATA = [
  { name: 'Blood Test', price: 500, normalRange: '< 200 mg/dl' },
  { name: 'Urine Test', price: 300, normalRange: 'Clear' },
  { name: 'X-Ray', price: 1000, normalRange: 'Normal' },
  { name: 'ECG', price: 800, normalRange: 'Normal sinus rhythm' },
  { name: 'Ultrasound', price: 1200, normalRange: 'Normal' },
  { name: 'CT Scan', price: 3000, normalRange: 'Normal' },
];

const STAFF_DATA = [
  { name: 'Nurse Maria', role: StaffRole.NURSE, experience: 8, phone: '9900000001', salary: 40000 },
  { name: 'Technician John', role: StaffRole.TECHNICIAN, experience: 5, phone: '9900000002', salary: 35000 },
  { name: 'Receptionist Priya', role: StaffRole.RECEPTIONIST, experience: 3, phone: '9900000003', salary: 25000 },
  { name: 'Lab Technician Arun', role: StaffRole.TECHNICIAN, experience: 6, phone: '9900000004', salary: 38000 },
  { name: 'Nurse Kavya', role: StaffRole.NURSE, experience: 10, phone: '9900000005', salary: 45000 },
];

const INVENTORY_DATA = [
  { name: 'Oxygen Cylinders', type: InventoryType.EQUIPMENT, quantity: 50, price: 8000, minLevel: 10 },
  { name: 'Syringes (10ml)', type: InventoryType.SUPPLIES, quantity: 5000, price: 5, minLevel: 500 },
  { name: 'Gloves (Sterile)', type: InventoryType.SUPPLIES, quantity: 10000, price: 2, minLevel: 2000 },
  { name: 'Gauze Pads', type: InventoryType.SUPPLIES, quantity: 2000, price: 10, minLevel: 500 },
  { name: 'IV Fluid (500ml)', type: InventoryType.SUPPLIES, quantity: 200, price: 150, minLevel: 50 },
  { name: 'Bed Sheets', type: InventoryType.SUPPLIES, quantity: 300, price: 500, minLevel: 100 },
  { name: 'Monitors', type: InventoryType.EQUIPMENT, quantity: 15, price: 50000, minLevel: 3 },
];

const WARDS_DATA = [
  { name: 'Cardiology Ward', department: 'Cardiology', totalBeds: 20, occupiedBeds: 15, pricePerDay: 5000 },
  { name: 'Orthopedics Ward', department: 'Orthopedics', totalBeds: 25, occupiedBeds: 18, pricePerDay: 4000 },
  { name: 'Pediatrics Ward', department: 'Pediatrics', totalBeds: 15, occupiedBeds: 10, pricePerDay: 3500 },
  { name: 'General Ward', department: 'General', totalBeds: 30, occupiedBeds: 22, pricePerDay: 2000 },
];

async function seedDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🌱 Starting comprehensive database seeding...\n');

    // 1. Create Doctors
    console.log('👨‍⚕️ Creating doctors...');
    const doctorRepo = AppDataSource.getRepository(Doctor);
    const userRepo = AppDataSource.getRepository(User);
    const doctors: Doctor[] = [];

    for (const doctorData of DOCTORS_DATA) {
      const user = userRepo.create({
        userId: crypto.randomUUID(),
        email: `${doctorData.name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`,
        password: await bcrypt.hash('DoctorPass123!', 10),
        roles: [UserRole.DOCTOR] as any,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: doctorData.name.split(' ')[0],
        lastName: doctorData.name.split(' ').slice(1).join(' '),
        phoneNumber: doctorData.phone,
      });
      const savedUser = await userRepo.save(user);

      const doctor = doctorRepo.create({
        user: savedUser,
        customUserId: (savedUser as any).userId,
        firstName: doctorData.name.split(' ')[0],
        lastName: doctorData.name.split(' ').slice(1).join(' '),
        specialization: doctorData.specialization,
        licenseNumber: `LIC${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        yearsOfExperience: Math.floor(Math.random() * 20) + 5,
      } as any);
      const savedDoctor = await doctorRepo.save(doctor) as any;
      doctors.push(savedDoctor);
    }
    console.log(`✅ Created ${doctors.length} doctors\n`);

    // 2. Create Patients
    console.log('👥 Creating patients...');
    const patientRepo = AppDataSource.getRepository(Patient);
    const patients: Patient[] = [];

    for (const patientData of PATIENTS_DATA) {
      const user = userRepo.create({
        userId: crypto.randomUUID(),
        email: patientData.email,
        password: await bcrypt.hash('PatientPass123!', 10),
        roles: [UserRole.PATIENT] as any,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: patientData.name.split(' ')[0],
        lastName: patientData.name.split(' ').slice(1).join(' '),
        phoneNumber: patientData.phone,
        dateOfBirth: new Date(2000 - patientData.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
        address: `${Math.floor(Math.random() * 500)} Hospital Street, City`,
      });
      const savedUser = await userRepo.save(user);

      const patient = patientRepo.create({
        user: savedUser,
        customUserId: (savedUser as any).userId,
        firstName: patientData.name.split(' ')[0],
        lastName: patientData.name.split(' ').slice(1).join(' '),
        bloodType: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)] as any,
        chronicDiseases: patientData.age > 50 ? ['Hypertension'] : [],
      } as any);
      const savedPatient = await patientRepo.save(patient) as any;
      patients.push(savedPatient);
    }
    console.log(`✅ Created ${patients.length} patients\n`);

    // 3. Create Appointments
    console.log('📅 Creating appointments...');
    const appointmentRepo = AppDataSource.getRepository(Appointment);
    const appointmentStatuses = [AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
    let appointmentCount = 0;

    for (let i = 0; i < 20; i++) {
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30) - 15);
      const hours = Math.floor(Math.random() * 8) + 9;
      appointmentDate.setHours(hours, 0, 0, 0);

      const appointment = appointmentRepo.create({
        doctorId: doctor.id,
        patientId: patient.id,
        appointmentDate,
        appointmentTime: `${hours.toString().padStart(2, '0')}:00`,
        reason: ['Routine Checkup', 'Follow-up', 'Emergency', 'Consultation'][Math.floor(Math.random() * 4)],
        status: appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)],
        notes: 'Appointment notes here',
      });
      await appointmentRepo.save(appointment);
      appointmentCount++;
    }
    console.log(`✅ Created ${appointmentCount} appointments\n`);

    // 4. Create Medicines
    console.log('💊 Creating medicines...');
    const medicineRepo = AppDataSource.getRepository(Medicine);
    const medicines: Medicine[] = [];

    for (const medicineData of MEDICINES_DATA) {
      const medicine = medicineRepo.create({
        medicineCode: `MED${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        name: medicineData.name,
        strength: medicineData.dosage,
        formulation: 'Tablet',
        purchasePrice: medicineData.price * 0.8,
        sellingPrice: medicineData.price,
        stock: medicineData.stock,
        manufacturer: 'Generic Pharma Co.',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const savedMedicine = await medicineRepo.save(medicine);
      medicines.push(savedMedicine);
    }
    console.log(`✅ Created ${medicines.length} medicines\n`);

    // 5. Create Lab Tests
    console.log('🔬 Creating lab tests...');
    const labTestRepo = AppDataSource.getRepository(LabTest);
    const labTests: LabTest[] = [];

    for (const testData of LAB_TESTS_DATA) {
      const labTest = labTestRepo.create({
        patientId: patients[0].id, // Assign to first patient for seeding
        testName: testData.name,
        description: `${testData.name} laboratory test`,
        status: LabTestStatus.ORDERED,
        orderedDate: new Date(),
      });
      const savedTest = await labTestRepo.save(labTest);
      labTests.push(savedTest);
    }
    console.log(`✅ Created ${labTests.length} lab tests\n`);

    // 6. Create Staff
    console.log('👨‍💼 Creating staff members...');
    const staffRepo = AppDataSource.getRepository(Staff);
    let staffCount = 0;

    for (const staffData of STAFF_DATA) {
      const user = userRepo.create({
        userId: crypto.randomUUID(),
        email: `${staffData.name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`,
        password: await bcrypt.hash('StaffPass123!', 10),
        roles: [staffData.role === StaffRole.NURSE ? UserRole.NURSE : staffData.role === StaffRole.RECEPTIONIST ? UserRole.RECEPTIONIST : UserRole.LAB_TECHNICIAN] as any,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        firstName: staffData.name.split(' ')[0],
        lastName: staffData.name.split(' ').slice(1).join(' '),
        phoneNumber: staffData.phone,
      });
      const savedUser = await userRepo.save(user);

      const staff = staffRepo.create({
        user: savedUser,
        userId: (savedUser as any).id,
        firstName: staffData.name.split(' ')[0],
        lastName: staffData.name.split(' ').slice(1).join(' '),
        staffId: `STAFF${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        role: staffData.role,
        yearsOfExperience: staffData.experience,
        status: StaffStatus.ACTIVE,
        joiningDate: new Date(Date.now() - staffData.experience * 365 * 24 * 60 * 60 * 1000),
      } as any);
      await staffRepo.save(staff);
      staffCount++;
    }
    console.log(`✅ Created ${staffCount} staff members\n`);

    // 7. Create Wards & Beds
    console.log('🛏️ Creating wards and beds...');
    const wardRepo = AppDataSource.getRepository(Ward);
    const bedRepo = AppDataSource.getRepository(Bed);
    let bedCount = 0;
    let wardIndex = 0;

    for (const wardData of WARDS_DATA) {
      wardIndex++;
      const ward = wardRepo.create({
        wardName: wardData.name,
        wardCode: `WARD-${wardIndex.toString().padStart(3, '0')}`,
        description: `${wardData.department} Ward`,
        totalBeds: wardData.totalBeds,
        pricePerDay: wardData.pricePerDay,
      });
      const savedWard = await wardRepo.save(ward);

      // Create beds
      for (let bedNum = 1; bedNum <= wardData.totalBeds; bedNum++) {
        const bed = bedRepo.create({
          wardId: savedWard.id,
          bedNumber: `BED-${bedNum.toString().padStart(3, '0')}`,
          status: bedNum <= wardData.occupiedBeds ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
          assignedPatientId: bedNum <= wardData.occupiedBeds ? patients[Math.floor(Math.random() * patients.length)].id : null,
        });
        await bedRepo.save(bed);
        bedCount++;
      }
    }
    console.log(`✅ Created ${WARDS_DATA.length} wards with ${bedCount} beds\n`);

    // 8. Create Inventory Items
    console.log('📦 Creating inventory items...');
    const inventoryRepo = AppDataSource.getRepository(Inventory);
    let inventoryCount = 0;

    for (const itemData of INVENTORY_DATA) {
      const inventory = inventoryRepo.create({
        itemCode: `INV${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        itemName: itemData.name,
        type: itemData.type,
        category: 'General',
        quantity: itemData.quantity,
        unit: 'units',
        unitCost: itemData.price * 0.8,
        sellingPrice: itemData.price,
        minimumLevel: itemData.minLevel,
        location: 'Main Store',
        status: itemData.quantity > itemData.minLevel ? InventoryStatus.IN_STOCK : InventoryStatus.LOW_STOCK,
      });
      await inventoryRepo.save(inventory);
      inventoryCount++;
    }
    console.log(`✅ Created ${inventoryCount} inventory items\n`);

    // 9. Create Radiology Requests
    console.log('🔍 Creating radiology requests...');
    const radiologyRepo = AppDataSource.getRepository(RadiologyRequest);
    const imagingTypes = [ImagingType.X_RAY, ImagingType.CT_SCAN, ImagingType.MRI, ImagingType.ULTRASOUND];
    let radiologyCount = 0;

    for (let i = 0; i < 10; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];

      const radiology = radiologyRepo.create({
        requestId: `RAD${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        patientId: patient.id,
        doctorId: doctor.id,
        imagingType: imagingTypes[Math.floor(Math.random() * imagingTypes.length)],
        bodyPart: ['Chest', 'Abdomen', 'Brain', 'Spine'][Math.floor(Math.random() * 4)],
        clinicalHistory: 'Clinical evaluation required',
        status: [ImagingStatus.PENDING, ImagingStatus.COMPLETED][Math.floor(Math.random() * 2)],
      });
      await radiologyRepo.save(radiology);
      radiologyCount++;
    }
    console.log(`✅ Created ${radiologyCount} radiology requests\n`);

    // 10. Create Invoices
    console.log('💰 Creating invoices...');
    const invoiceRepo = AppDataSource.getRepository(Invoice);
    const invoiceStatuses = [InvoiceStatus.PAID, InvoiceStatus.PENDING, InvoiceStatus.OVERDUE];

    for (let i = 0; i < 15; i++) {
      const patient = patients[i % patients.length];
      const subtotal = Math.floor(Math.random() * 15000) + 2000;
      const taxAmount = Math.floor(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount;

      const invoice = invoiceRepo.create({
        invoiceNumber: `INV${Date.now()}${i}`,
        patientId: patient.id,
        subtotal,
        taxAmount,
        taxPercentage: 18,
        totalAmount,
        dueAmount: totalAmount,
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        notes: 'Hospital treatment and medical services',
      });
      await invoiceRepo.save(invoice);
    }
    console.log('✅ Created invoices\n');

    // 10. Create Operation Theaters & Surgeries
    console.log('🏥 Creating operation theaters and surgeries...');
    const theatreRepo = AppDataSource.getRepository(OperationTheater);
    const surgeryRepo = AppDataSource.getRepository(Surgery);

    const theaters: OperationTheater[] = [];
    for (let i = 1; i <= 3; i++) {
      const theater = theatreRepo.create({
        theatreCode: `OT-${i}`,
        theatreName: `Operation Theater ${i}`,
        isAvailable: true,
        facilities: 'Standard surgical equipment',
      });
      const savedTheater = await theatreRepo.save(theater);
      theaters.push(savedTheater);
    }

    const surgeryStatuses = [SurgeryStatus.SCHEDULED, SurgeryStatus.IN_PROGRESS, SurgeryStatus.COMPLETED];
    let surgeryCount = 0;

    for (let i = 0; i < 8; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const theater = theaters[Math.floor(Math.random() * theaters.length)];

      const surgery = surgeryRepo.create({
        surgeryId: `SURG${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        theatreId: theater.theatreCode,
        patientId: patient.id,
        surgeonId: doctor.id,
        surgeryType: ['Appendectomy', 'Hernia Repair', 'Knee Replacement', 'Cataract Surgery'][Math.floor(Math.random() * 4)],
        scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: surgeryStatuses[Math.floor(Math.random() * surgeryStatuses.length)],
        preOpNotes: 'Pre-operative assessment completed',
      });
      await surgeryRepo.save(surgery);
      surgeryCount++;
    }
    console.log(`✅ Created ${theaters.length} theaters and ${surgeryCount} surgeries\n`);

    // 11. Create Financial Records (Revenue & Expenses)
    console.log('💵 Creating financial records...');
    const expenseRepo = AppDataSource.getRepository(Expense);
    const revenueRepo = AppDataSource.getRepository(Revenue);
    let recordCount = 0;

    const expenseTypes = Object.values(ExpenseType);
    for (let i = 0; i < 25; i++) {
      // Revenue entries
      const revenue = revenueRepo.create({
        revenueId: `REV${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        source: ['Patient Fees', 'Consultation', 'Lab Tests', 'Surgery', 'Medicines'][Math.floor(Math.random() * 5)],
        amount: Math.floor(Math.random() * 50000) + 5000,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        patientId: patients[Math.floor(Math.random() * patients.length)].id,
        remarks: 'Hospital revenue',
      });
      await revenueRepo.save(revenue);

      // Expense entries
      const expense = expenseRepo.create({
        expenseId: `EXP${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        expenseType: expenseTypes[Math.floor(Math.random() * expenseTypes.length)] as ExpenseType,
        description: 'Hospital expenses',
        amount: Math.floor(Math.random() * 30000) + 2000,
        vendorName: ['Medical Supplies Inc', 'Pharma Corp', 'Equipment Ltd'][Math.floor(Math.random() * 3)],
        invoiceNumber: `INV${Math.floor(Math.random() * 10000)}`,
        expenseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: PaymentStatus.PAID,
        remarks: 'Expense record',
      });
      await expenseRepo.save(expense);
      recordCount += 2;
    }
    console.log(`✅ Created ${recordCount} financial records (revenue & expenses)\n`);

    // 12. Create Compliance Records
    console.log('✅ Creating compliance records...');
    const complianceRepo = AppDataSource.getRepository(ComplianceRecord);
    const complianceTypes = [ComplianceType.HIPAA, ComplianceType.GDPR, ComplianceType.DATA_SECURITY];
    let complianceCount = 0;

    for (let i = 0; i < 12; i++) {
      const compliance = complianceRepo.create({
        recordId: `COMP${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        complianceType: complianceTypes[Math.floor(Math.random() * complianceTypes.length)],
        description: 'Compliance check and audit',
        status: [ComplianceStatus.COMPLIANT, ComplianceStatus.NON_COMPLIANT][Math.floor(Math.random() * 2)],
        lastAuditDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        remarks: 'Regular compliance audit',
      });
      await complianceRepo.save(compliance);
      complianceCount++;
    }
    console.log(`✅ Created ${complianceCount} compliance records\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   • ${doctors.length} Doctors`);
    console.log(`   • ${patients.length} Patients`);
    console.log(`   • ${appointmentCount} Appointments`);
    console.log(`   • ${medicines.length} Medicines`);
    console.log(`   • ${labTests.length} Lab Tests`);
    console.log(`   • ${staffCount} Staff Members`);
    console.log(`   • ${bedCount} Beds across ${WARDS_DATA.length} Wards`);
    console.log(`   • ${inventoryCount} Inventory Items`);
    console.log(`   • ${radiologyCount} Radiology Requests`);
    console.log(`   • ${surgeryCount} Surgeries`);
    console.log(`   • ${recordCount} Financial Records`);
    console.log(`   • ${complianceCount} Compliance Records`);
    console.log('\n💡 All data is properly interconnected!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
