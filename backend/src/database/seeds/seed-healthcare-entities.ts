import 'reflect-metadata';
import AppDataSource from '../data-source';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { Patient, BloodType } from '../../modules/patients/entities/patient.entity';
import { Doctor } from '../../modules/doctors/entities/doctor.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../../modules/appointments/entities/appointment.entity';
import {
  Prescription,
  PrescriptionStatus,
} from '../../modules/prescriptions/entities/prescription.entity';
import { Invoice, InvoiceStatus } from '../../modules/billing/entities/invoice.entity';
import { faker } from '@faker-js/faker';

export async function seedHealthcareEntities() {
  const userRepo = AppDataSource.getRepository(User);
  const patientRepo = AppDataSource.getRepository(Patient);
  const doctorRepo = AppDataSource.getRepository(Doctor);
  const appointmentRepo = AppDataSource.getRepository(Appointment);
  const prescriptionRepo = AppDataSource.getRepository(Prescription);
  const invoiceRepo = AppDataSource.getRepository(Invoice);

  console.log('Seeding doctors and patients...');

  const doctorUsers = await userRepo.find({ where: { roles: [UserRole.DOCTOR] as any } });
  const patientUsers = await userRepo.find({ where: { roles: [UserRole.PATIENT] as any } });

  const doctors: Doctor[] = [];
  for (const user of doctorUsers) {
    const existingDoctor = await doctorRepo.findOne({ where: { customUserId: user.userId } });
    if (existingDoctor) continue;

    const doctor = new Doctor({
      user,
      customUserId: user.userId,
      doctorId: `DOC-${faker.string.numeric(4)}`,
      specialization: faker.helpers.arrayElement([
        'Cardiology',
        'Pediatrics',
        'Neurology',
        'Orthopedics',
        'Dermatology',
        'General Medicine',
        'Oncology',
        'Psychiatry',
        'Gastroenterology',
      ]),
      licenseNumber: `LIC-${faker.string.alphanumeric(8).toUpperCase()}`,
      yearsOfExperience: faker.number.int({ min: 2, max: 40 }),
      rating: faker.number.float({ min: 3.5, max: 5, multipleOf: 0.1 }),
      consultationFee: faker.number.int({ min: 500, max: 5000 }),
      biography: faker.lorem.paragraph(),
      isActive: true,
      availableSlots: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDuration: 30 },
        { day: 'Friday', startTime: '09:00', endTime: '13:00', slotDuration: 30 },
      ],
    });
    doctors.push(doctor);
  }
  if (doctors.length > 0) await doctorRepo.save(doctors);

  const patients: Patient[] = [];
  for (const user of patientUsers) {
    const existingPatient = await patientRepo.findOne({ where: { customUserId: user.userId } });
    if (existingPatient) continue;

    const patient = new Patient({
      user,
      customUserId: user.userId,
      patientId: `PAT-${faker.string.numeric(4)}`,
      bloodType: faker.helpers.enumValue(BloodType),
      allergies: faker.helpers.arrayElements(
        ['Peanuts', 'Penicillin', 'Dust', 'Latex', 'Shellfish'],
        { min: 0, max: 3 },
      ),
      chronicDiseases: faker.helpers.arrayElements(
        ['Diabetes', 'Hypertension', 'Asthma', 'Arthritis'],
        { min: 0, max: 2 },
      ),
      insuranceProvider: faker.company.name(),
      insurancePolicyNumber: faker.string.alphanumeric(10).toUpperCase(),
      emergencyContactName: faker.person.fullName(),
      emergencyContactPhone: faker.phone.number(),
      emergencyContactRelation: faker.helpers.arrayElement([
        'Spouse',
        'Parent',
        'Sibling',
        'Friend',
      ]),
      height: faker.number.int({ min: 140, max: 200 }),
      weight: faker.number.int({ min: 40, max: 120 }),
    });
    patients.push(patient);
  }
  if (patients.length > 0) await patientRepo.save(patients);

  console.log('Seeding appointments, prescriptions, and invoices...');

  const appointments: Appointment[] = [];
  const prescriptions: Prescription[] = [];
  const invoices: Invoice[] = [];

  for (let i = 0; i < 150; i++) {
    const patient = faker.helpers.arrayElement(patients);
    const doctor = faker.helpers.arrayElement(doctors);
    const date = faker.date.between({ from: '2025-01-01', to: '2026-12-31' });

    const appointment = new Appointment({
      patient,
      patientId: patient.id,
      doctor,
      doctorId: doctor.id,
      appointmentDate: date,
      appointmentTime: faker.helpers.arrayElement([
        '09:00',
        '10:00',
        '11:00',
        '14:00',
        '15:00',
        '16:00',
      ]),
      duration: 30,
      status: faker.helpers.enumValue(AppointmentStatus),
      reason: faker.lorem.sentence(),
      diagnosis: i % 2 === 0 ? faker.lorem.sentence() : undefined,
    });
    appointments.push(appointment);

    if (i % 3 === 0) {
      const prescription = new Prescription({
        patient,
        patientId: patient.id,
        doctor,
        doctorId: doctor.id,
        prescriptionNumber: `RX-${faker.string.numeric(8)}`,
        status: faker.helpers.enumValue(PrescriptionStatus),
        issuedDate: date,
        medicines: [
          {
            medicineId: faker.string.uuid(),
            medicineName: faker.helpers.arrayElement([
              'Paracetamol',
              'Amoxicillin',
              'Ibuprofen',
              'Metformin',
              'Atorvastatin',
            ]),
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '7 days',
            instructions: 'After food',
            quantity: 14,
          },
        ],
      });
      prescriptions.push(prescription);
    }

    if (i % 2 === 0) {
      const amount = faker.number.int({ min: 1000, max: 10000 });
      const invoice = new Invoice({
        patient,
        patientId: patient.id,
        invoiceNumber: `INV-${faker.string.numeric(10)}`,
        issueDate: date,
        dueDate: faker.date.future({ years: 0.1, refDate: date }),
        status: faker.helpers.enumValue(InvoiceStatus),
        subtotal: amount,
        taxAmount: amount * 0.1,
        taxPercentage: 10,
        totalAmount: amount * 1.1,
        paidAmount: i % 4 === 0 ? amount * 1.1 : 0,
        dueAmount: i % 4 === 0 ? 0 : amount * 1.1,
        lineItems: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPrice: amount,
            totalPrice: amount,
            category: 'consultation',
          },
        ],
      });
      invoices.push(invoice);
    }

    if (appointments.length >= 50) {
      await appointmentRepo.save(appointments);
      appointments.length = 0;
    }
    if (prescriptions.length >= 50) {
      await prescriptionRepo.save(prescriptions);
      prescriptions.length = 0;
    }
    if (invoices.length >= 50) {
      await invoiceRepo.save(invoices);
      invoices.length = 0;
    }
  }

  if (appointments.length > 0) await appointmentRepo.save(appointments);
  if (prescriptions.length > 0) await prescriptionRepo.save(prescriptions);
  if (invoices.length > 0) await invoiceRepo.save(invoices);

  console.log('Aarogentix entities seeding completed.');
}
