import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient, BloodType } from '../patients/entities/patient.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import { Ward } from '../wards/entities/ward.entity';
import { Inventory, InventoryType, InventoryStatus } from '../inventory/entities/inventory.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Injectable()
export class DemoDataService {
    private readonly logger = new Logger(DemoDataService.name);

    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
        @InjectRepository(Ward) private wardRepo: Repository<Ward>,
        @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
        @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    ) { }

    async generate(organizationId: string): Promise<{ created: Record<string, number> }> {
        this.logger.log(`Generating demo data for org: ${organizationId}`);

        // Check if org already has significant data
        const existingPatients = await this.patientRepo.count({ where: { organizationId } });
        if (existingPatients > 5) {
            throw new ConflictException('Demo data already exists for this organization. Remove existing data first or skip this step.');
        }

        const created: Record<string, number> = {};
        const hashedPassword = await bcrypt.hash('Demo@123456', 10);

        // ── 1. Doctors ───────────────────────────────────────────────
        const doctorData = [
            { firstName: 'Arjun', lastName: 'Mehta', specialization: 'Cardiology', fee: 800, exp: 12 },
            { firstName: 'Priya', lastName: 'Sharma', specialization: 'Pediatrics', fee: 600, exp: 8 },
            { firstName: 'Ravi', lastName: 'Patel', specialization: 'Orthopedics', fee: 700, exp: 15 },
        ];

        const doctorUsers: User[] = [];
        const doctors: Doctor[] = [];

        for (let i = 0; i < doctorData.length; i++) {
            const d = doctorData[i];
            const userCount = await this.userRepo.count();
            const userId = `DOC-${String(userCount + i + 1).padStart(6, '0')}`;
            const email = `demo.${d.firstName.toLowerCase()}@demo-hospital.com`;

            const existing = await this.userRepo.findOne({ where: { email } });
            if (existing) { doctorUsers.push(existing); continue; }

            const user = this.userRepo.create({
                userId,
                email,
                firstName: d.firstName,
                lastName: d.lastName,
                password: hashedPassword,
                organizationId,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                gender: i === 1 ? 'female' : 'male',
            });
            const savedUser = await this.userRepo.save(user);
            doctorUsers.push(savedUser);

            const doctor = this.doctorRepo.create({
                organizationId,
                customUserId: savedUser.id,
                doctorId: `DR-${String(i + 1).padStart(3, '0')}`,
                specialization: d.specialization,
                yearsOfExperience: d.exp,
                consultationFee: d.fee,
                rating: 4.2 + i * 0.2,
                isActive: true,
                licenseNumber: `LIC-${organizationId.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
                qualifications: ['MBBS', i === 0 ? 'MD Cardiology' : i === 1 ? 'MD Pediatrics' : 'MS Orthopedics'],
                user: savedUser,
            });
            doctors.push(await this.doctorRepo.save(doctor));
        }
        created.doctors = doctors.length;

        // ── 2. Patients ──────────────────────────────────────────────
        const patientData = [
            { first: 'Amit', last: 'Kumar', gender: 'male', age: 45, blood: BloodType.O_POSITIVE },
            { first: 'Sunita', last: 'Singh', gender: 'female', age: 32, blood: BloodType.A_POSITIVE },
            { first: 'Rajesh', last: 'Gupta', gender: 'male', age: 58, blood: BloodType.B_POSITIVE },
            { first: 'Kavita', last: 'Joshi', gender: 'female', age: 27, blood: BloodType.AB_POSITIVE },
            { first: 'Vikram', last: 'Rao', gender: 'male', age: 39, blood: BloodType.O_NEGATIVE },
            { first: 'Anita', last: 'Nair', gender: 'female', age: 52, blood: BloodType.A_NEGATIVE },
            { first: 'Suresh', last: 'Reddy', gender: 'male', age: 63, blood: BloodType.B_NEGATIVE },
            { first: 'Meena', last: 'Pillai', gender: 'female', age: 35, blood: BloodType.AB_NEGATIVE },
            { first: 'Deepak', last: 'Verma', gender: 'male', age: 48, blood: BloodType.O_POSITIVE },
            { first: 'Pooja', last: 'Sharma', gender: 'female', age: 29, blood: BloodType.A_POSITIVE },
        ];

        const savedPatients: Patient[] = [];
        for (let i = 0; i < patientData.length; i++) {
            const p = patientData[i];
            const userCount = await this.userRepo.count();
            const userId = `PAT-${String(userCount + i + 1).padStart(6, '0')}`;
            const email = `demo.${p.first.toLowerCase()}.${p.last.toLowerCase()}@patient.demo`;

            const existing = await this.userRepo.findOne({ where: { email } });
            if (existing) { continue; }

            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - p.age);

            const user = this.userRepo.create({
                userId,
                email,
                firstName: p.first,
                lastName: p.last,
                password: hashedPassword,
                organizationId,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                gender: p.gender as any,
                dateOfBirth: dob,
            });
            const savedUser = await this.userRepo.save(user);

            const patient = this.patientRepo.create({
                organizationId,
                customUserId: savedUser.id,
                patientId: `PAT-${String(i + 1).padStart(3, '0')}`,
                bloodType: p.blood,
                user: savedUser,
                height: 160 + Math.floor(Math.random() * 25),
                weight: 55 + Math.floor(Math.random() * 30),
                allergies: i % 3 === 0 ? ['Penicillin'] : [],
                chronicDiseases: i % 4 === 0 ? ['Hypertension'] : [],
                emergencyContactName: 'Family Member',
                emergencyContactPhone: `+91-9${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
            });
            savedPatients.push(await this.patientRepo.save(patient));
        }
        created.patients = savedPatients.length;

        // ── 3. Appointments ──────────────────────────────────────────
        const statuses = [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.COMPLETED,
        ];

        const savedAppointments: Appointment[] = [];
        for (let i = 0; i < Math.min(8, savedPatients.length); i++) {
            const patient = savedPatients[i];
            const doctor = doctors[i % doctors.length];
            if (!patient || !doctor) continue;

            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + (i - 3)); // mix of past/future

            const apt = this.appointmentRepo.create({
                organizationId,
                patientId: patient.id,
                doctorId: doctor.id,
                appointmentDate,
                appointmentTime: `${9 + (i % 8)}:00`,
                duration: 30,
                tokenNumber: i + 1,
                status: statuses[i % statuses.length],
                reason: ['Routine Checkup', 'Fever', 'Back Pain', 'Chest Pain', 'Follow-up'][i % 5],
                notes: 'Demo appointment created during onboarding',
            });
            savedAppointments.push(await this.appointmentRepo.save(apt));
        }
        created.appointments = savedAppointments.length;

        // ── 4. Wards ─────────────────────────────────────────────────
        const wardData = [
            { name: 'General Ward A', code: 'GWA-001', beds: 20, price: 800 },
            { name: 'ICU', code: 'ICU-001', beds: 8, price: 5000 },
            { name: 'Pediatric Ward', code: 'PED-001', beds: 12, price: 1200 },
        ];

        for (const w of wardData) {
            const existing = await this.wardRepo.findOne({
                where: { wardCode: `${organizationId.slice(0, 4)}-${w.code}` }
            });
            if (existing) continue;

            await this.wardRepo.save(this.wardRepo.create({
                organizationId,
                wardCode: `${organizationId.slice(0, 4)}-${w.code}`,
                wardName: w.name,
                description: `Demo ${w.name}`,
                totalBeds: w.beds,
                occupiedBeds: Math.floor(w.beds * 0.6),
                pricePerDay: w.price,
                floor: '1',
                block: 'A',
            }));
        }
        created.wards = wardData.length;

        // ── 5. Inventory ─────────────────────────────────────────────
        const inventoryData = [
            { name: 'Paracetamol 500mg', code: 'MED-001', type: InventoryType.MEDICINE, qty: 500, unit: 'tablets', cost: 2, price: 5 },
            { name: 'Amoxicillin 250mg', code: 'MED-002', type: InventoryType.MEDICINE, qty: 200, unit: 'capsules', cost: 8, price: 15 },
            { name: 'Blood Pressure Monitor', code: 'EQP-001', type: InventoryType.EQUIPMENT, qty: 5, unit: 'units', cost: 2500, price: 4000 },
            { name: 'Surgical Gloves (M)', code: 'SUP-001', type: InventoryType.SUPPLIES, qty: 50, unit: 'boxes', cost: 120, price: 200 },
            { name: 'Glucose Test Strips', code: 'DGK-001', type: InventoryType.DIAGNOSTIC_KIT, qty: 15, unit: 'packs', cost: 250, price: 400 },
        ];

        for (const item of inventoryData) {
            const code = `${organizationId.slice(0, 4).toUpperCase()}-${item.code}`;
            const existing = await this.inventoryRepo.findOne({ where: { itemCode: code } });
            if (existing) continue;

            await this.inventoryRepo.save(this.inventoryRepo.create({
                organizationId,
                itemCode: code,
                itemName: item.name,
                type: item.type,
                category: item.type,
                quantity: item.qty,
                unit: item.unit,
                unitCost: item.cost,
                sellingPrice: item.price,
                status: item.qty < 20 ? InventoryStatus.LOW_STOCK : InventoryStatus.IN_STOCK,
                minimumLevel: 20,
                supplier: 'Demo Supplier Pvt Ltd',
            }));
        }
        created.inventory = inventoryData.length;

        this.logger.log(`Demo data generated for org ${organizationId}:`, created);
        return { created };
    }
}
