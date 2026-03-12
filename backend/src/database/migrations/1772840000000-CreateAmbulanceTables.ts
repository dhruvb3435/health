import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAmbulanceTables1772840000000 implements MigrationInterface {
    name = 'CreateAmbulanceTables1772840000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "vehicle_type_enum" AS ENUM('basic_life_support', 'advanced_life_support', 'patient_transport', 'neonatal');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "ambulance_status_enum" AS ENUM('available', 'on_trip', 'maintenance', 'out_of_service');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "trip_type_enum" AS ENUM('emergency', 'scheduled', 'inter_facility', 'dead_body');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "trip_status_enum" AS ENUM('dispatched', 'en_route_pickup', 'patient_picked', 'en_route_hospital', 'completed', 'cancelled');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "trip_priority_enum" AS ENUM('normal', 'urgent', 'critical');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        // Ambulances table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ambulances" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" uuid NOT NULL,
                "vehicleNumber" varchar(50) NOT NULL,
                "vehicleType" "vehicle_type_enum" NOT NULL,
                "driverName" varchar(200) NOT NULL,
                "driverPhone" varchar(20) NOT NULL,
                "status" "ambulance_status_enum" NOT NULL DEFAULT 'available',
                "currentLocation" varchar(255),
                "equipmentList" text,
                "lastServiceDate" date,
                "insuranceExpiry" date,
                "fitnessExpiry" date,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ambulances" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ambulances_org" FOREIGN KEY ("organizationId")
                    REFERENCES "organizations"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ambulances_org_vehicle" ON "ambulances" ("organizationId", "vehicleNumber");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulances_org_status" ON "ambulances" ("organizationId", "status");`);

        // Ambulance Trips table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ambulance_trips" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" uuid NOT NULL,
                "ambulanceId" uuid NOT NULL,
                "tripNumber" varchar(50) NOT NULL,
                "patientId" uuid,
                "patientName" varchar(255) NOT NULL,
                "patientContact" varchar(20),
                "pickupLocation" text NOT NULL,
                "dropLocation" text NOT NULL,
                "tripType" "trip_type_enum" NOT NULL,
                "status" "trip_status_enum" NOT NULL DEFAULT 'dispatched',
                "priority" "trip_priority_enum" NOT NULL DEFAULT 'normal',
                "dispatchTime" TIMESTAMP NOT NULL DEFAULT now(),
                "pickupTime" TIMESTAMP,
                "arrivalTime" TIMESTAMP,
                "completionTime" TIMESTAMP,
                "distance" decimal(8,2),
                "fare" decimal(10,2),
                "driverNotes" text,
                "emergencyCaseId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ambulance_trips" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ambulance_trips_org" FOREIGN KEY ("organizationId")
                    REFERENCES "organizations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_ambulance_trips_ambulance" FOREIGN KEY ("ambulanceId")
                    REFERENCES "ambulances"("id") ON DELETE RESTRICT,
                CONSTRAINT "FK_ambulance_trips_patient" FOREIGN KEY ("patientId")
                    REFERENCES "patients"("id") ON DELETE SET NULL
            );
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ambulance_trips_org_number" ON "ambulance_trips" ("organizationId", "tripNumber");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trips_org_status" ON "ambulance_trips" ("organizationId", "status");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trips_org_ambulance" ON "ambulance_trips" ("organizationId", "ambulanceId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trips_org_patient" ON "ambulance_trips" ("organizationId", "patientId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trips_org_dispatch" ON "ambulance_trips" ("organizationId", "dispatchTime");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "ambulance_trips";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ambulances";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "trip_priority_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "trip_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "trip_type_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "ambulance_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type_enum";`);
    }
}
