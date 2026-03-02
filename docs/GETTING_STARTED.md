# Getting Started Guide

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized setup)
- Git
- AWS Account (for S3 and deployment)

### Local Development Setup

#### 1. Clone & Install
```bash
git clone <repository-url>
cd healthcare

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Environment Configuration
```bash
# Backend setup
cd backend
cp .env.example .env

# Edit .env with your local settings
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=healthcare_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=healthcare_db
JWT_SECRET=your-secret-key
```

#### 3. Database Setup
```bash
# Create PostgreSQL database
createdb healthcare_db

# Run migrations
cd backend
npm run migration:run

# (Optional) Seed sample data
npm run seed:run
```

#### 4. Start Services

**Option A: Using Docker Compose**
```bash
# From root directory
docker-compose up

# Services will be available at:
# - Backend: http://localhost:3001
# - Frontend: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Swagger Docs: http://localhost:3001/api/docs
```

**Option B: Manual Start**
```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Terminal 3: (Optional) Start Redis
redis-server
```

### Access Points
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:3001/api/docs
- **Database**: PostgreSQL on localhost:5432

### Default Test Credentials
```
Email: doctor@example.com
Password: DemoPassword123!

Email: patient@example.com
Password: DemoPassword123!
```

## Project Structure

```
healthcare/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, patients, etc.)
│   │   ├── common/           # Shared services & utilities
│   │   ├── guards/           # Authentication & authorization
│   │   ├── filters/          # Exception handling
│   │   ├── interceptors/     # Request/response handling
│   │   ├── config/           # Configuration files
│   │   ├── database/         # Database config & migrations
│   │   └── main.ts
│   ├── test/
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities & API client
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Global & CSS modules
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md       # System design & architecture
│   ├── API.md                # REST API documentation
│   ├── DATABASE.md           # Database schema & design
│   ├── HIPAA.md              # HIPAA compliance guide
│   ├── DEPLOYMENT.md         # AWS deployment guide
│   └── README.md
│
└── infrastructure/
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── terraform/            # Infrastructure as Code
```

## Core Modules Overview

### 1. Authentication Module
**Path**: `backend/src/modules/auth`

Handles user registration, login, token management, and password reset.

**Key Features**:
- JWT token generation & refresh
- Secure password hashing (bcrypt)
- MFA support (optional)
- Session management

**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### 2. Patient Management Module
**Path**: `backend/src/modules/patients`

Manages patient demographics, medical history, and records.

**Key Features**:
- Patient profiles & demographics
- Medical history tracking
- Emergency contacts
- Insurance information
- Medical record storage (EMR/EHR)

**API Endpoints**:
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PATCH /api/patients/:id` - Update patient
- `GET /api/patients/:id/medical-records` - Get medical records

### 3. Doctor Management Module
**Path**: `backend/src/modules/doctors`

Manages doctor profiles, qualifications, and schedules.

**Key Features**:
- Doctor profiles & specializations
- Availability management
- Qualifications & certifications
- Rating system

### 4. Appointment Scheduling Module
**Path**: `backend/src/modules/appointments`

Handles appointment booking, rescheduling, and management.

**Key Features**:
- Appointment booking
- Conflict detection
- Virtual consultation support
- Appointment reminders
- Cancellation with reason tracking

### 5. Prescription Management Module
**Path**: `backend/src/modules/prescriptions`

E-prescription creation, PDF generation, and pharmacy notifications.

**Key Features**:
- E-prescription creation
- PDF generation
- Digital signature support
- Pharmacy notifications
- Prescription expiry tracking

### 6. Billing & Invoicing Module
**Path**: `backend/src/modules/billing`

Invoice generation, payment tracking, and reporting.

**Key Features**:
- Invoice creation
- Payment tracking (multiple methods)
- Tax calculation
- Insurance claim management

### 7. Laboratory Module
**Path**: `backend/src/modules/laboratory`

Lab test ordering, result management, and report generation.

**Key Features**:
- Test ordering
- Sample tracking
- Result input & validation
- Report generation
- Quality control

### 8. Pharmacy Module
**Path**: `backend/src/modules/pharmacy`

Medicine inventory and stock management.

**Key Features**:
- Medicine catalog
- Stock level tracking
- Reorder management
- Supplier management
- Expiry tracking

### 9. Dashboard & Analytics Module
**Path**: `backend/src/modules/dashboard`

Real-time metrics and analytics reporting.

**Key Features**:
- Real-time metrics
- Revenue analytics
- Patient statistics
- Performance reports

## Key Concepts

### Role-Based Access Control (RBAC)

```typescript
enum UserRole {
  ADMIN = 'admin',           // Full system access
  DOCTOR = 'doctor',         // Patient management, prescriptions
  NURSE = 'nurse',           // Patient vitals, appointment support
  RECEPTIONIST = 'receptionist', // Appointment booking
  PATIENT = 'patient',       // Own medical records
  PHARMACIST = 'pharmacist', // Prescription fulfillment
  LAB_TECHNICIAN = 'lab_technician' // Lab test management
}
```

### Authentication Flow

```
1. User registers/logs in
2. Backend validates credentials
3. JWT token generated (24h expiry)
4. Refresh token issued (7d expiry)
5. Tokens stored in localStorage
6. Subsequent requests include Authorization header
7. Token refresh when access token expires
8. Automatic logout when refresh token expires
```

### Data Security

**Encryption**:
- Passwords: bcrypt with 10 salt rounds
- PHI Fields: AES-256 encryption
- File Storage: S3 with server-side encryption
- Transmission: TLS 1.2+ / HTTPS

**Access Control**:
- JWT-based authentication
- Role-based authorization
- Audit logging of all actions
- IP whitelisting (for admin)

## Development Best Practices

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Strict null checks enabled

### Testing
```bash
# Backend tests
cd backend
npm run test              # Run tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report

# Frontend tests (add jest configuration)
cd frontend
npm run test
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/patient-management
git add .
git commit -m "feat: add patient management features"
git push origin feature/patient-management

# Create Pull Request on GitHub
# Code review & CI/CD checks
# Merge to main
```

### Database Migrations
```bash
# Create new migration
npm run migration:create -- CreatePatientsTable

# Generate from entities
npm run migration:generate -- CreateTablesFromEntities

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Common Tasks

### Adding a New Feature

1. **Create Module Structure**
```bash
# For example: adding a new "Vitals" module
mkdir -p backend/src/modules/vitals/{entities,dtos,services,controllers}

# Create files:
# - vital.entity.ts       (Database entity)
# - create-vital.dto.ts   (Validation DTO)
# - vital.service.ts      (Business logic)
# - vital.controller.ts   (HTTP endpoints)
# - vital.module.ts       (Module definition)
```

2. **Create Entity**
```typescript
// vital.entity.ts
@Entity('vitals')
export class Vital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @Column()
  temperature: number;

  @Column()
  bloodPressure: string;

  @Column()
  heartRate: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

3. **Create DTOs**
```typescript
// create-vital.dto.ts
export class CreateVitalDto {
  @IsNumber()
  temperature: number;

  @IsString()
  bloodPressure: string;

  @IsNumber()
  heartRate: number;
}
```

4. **Create Service**
```typescript
// vital.service.ts
@Injectable()
export class VitalService {
  constructor(
    @InjectRepository(Vital)
    private vitalRepository: Repository<Vital>,
  ) {}

  async create(patientId: string, dto: CreateVitalDto) {
    // Business logic here
  }
}
```

5. **Create Controller**
```typescript
// vital.controller.ts
@Controller('api/vitals')
export class VitalController {
  constructor(private vitalService: VitalService) {}

  @Post()
  create(@Body() dto: CreateVitalDto) {
    return this.vitalService.create(dto);
  }
}
```

6. **Register Module**
```typescript
// vital.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Vital])],
  providers: [VitalService],
  controllers: [VitalController],
})
export class VitalModule {}
```

7. **Add to App Module**
```typescript
// app.module.ts
@Module({
  imports: [
    // ... other modules
    VitalModule,
  ],
})
export class AppModule {}
```

### Deploying to Production

1. **Prepare Code**
```bash
npm run build
npm run lint
npm run test
```

2. **Deploy to AWS**
```bash
# Using CI/CD (recommended)
git push origin main

# Or manual deployment
docker build -t healthcare-api:latest ./backend
docker tag healthcare-api:latest $ECR_REGISTRY/healthcare-api:latest
docker push $ECR_REGISTRY/healthcare-api:latest
```

3. **Verify Deployment**
```bash
# Check health endpoint
curl https://api.healthcare.com/health

# Check logs
aws logs tail /aws/ecs/healthcare-api --follow
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U healthcare_user -d healthcare_db

# Check migrations
npm run migration:run

# Verify environment variables
cat .env | grep DATABASE
```

### Frontend Not Connecting to Backend
```bash
# Check backend is running
curl http://localhost:3001/api/docs

# Verify CORS settings in backend
# Check API_URL in frontend .env

# Clear browser cache
# Check browser console for errors
```

### JWT Token Expiration
```bash
# Tokens expire after 24h (access) or 7d (refresh)
# Implement automatic refresh on 401 response
# Users will be logged out automatically after 7 days
```

## Performance Monitoring

### Frontend Performance
```bash
# Lighthouse audit
npm audit

# Bundle analysis
npm run analyze
```

### Backend Monitoring
```bash
# View logs
docker logs healthcare-backend

# Check database performance
psql healthcare_db
\d+ appointments  -- Show table details
EXPLAIN ANALYZE SELECT * FROM appointments WHERE doctorId = 'xxx';
```

## Security Checklist

- [ ] All dependencies are up-to-date
- [ ] Environment variables are configured
- [ ] SSL/TLS enabled in production
- [ ] Database backups are working
- [ ] Audit logging is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is in place
- [ ] API keys are rotated regularly
- [ ] S3 bucket access is restricted
- [ ] Database encryption is enabled

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io)
- [HIPAA Compliance Guide](./HIPAA.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Support & Contact

- **Issues**: Create GitHub issues for bugs
- **Features**: Suggest features via GitHub discussions
- **Security**: Report security issues to security@healthcare.com
- **Documentation**: Update docs/ folder for new features

---

**Last Updated**: February 2026
**Version**: 1.0.0
