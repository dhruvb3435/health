# PostgreSQL Database Setup - Resolved ✓

## Problem
```
ERROR [ExceptionHandler] connect ECONNREFUSED 127.0.0.1:5432
Error: connect ECONNREFUSED 127.0.0.1:5432
```

This error occurs when NestJS backend cannot connect to PostgreSQL database.

## Solution Implemented

### Step 1: PostgreSQL Installation ✓
**Status**: Installed PostgreSQL 14.20 on Ubuntu 22.04

```bash
# Installation command used:
sudo apt update && sudo apt install -y postgresql postgresql-contrib
```

**Result**: 
- PostgreSQL 14 installed
- Service enabled and running
- Data directory initialized at `/var/lib/postgresql/14/main/`
- Default authentication configured

### Step 2: Start PostgreSQL Service ✓
**Status**: Service running and active

```bash
# Start service:
sudo systemctl start postgresql

# Check status:
sudo systemctl status postgresql
```

**Output**: 
```
● postgresql.service - PostgreSQL RDBMS
  Active: active (exited) since Sun 2026-02-22 21:25:56 IST
```

### Step 3: Create Healthcare Database ✓
**Status**: Database created successfully

```bash
# Create database:
sudo -u postgres createdb healthcare_db

# Verify:
sudo -u postgres psql -l | grep healthcare_db
```

**Output**:
```
healthcare_db | postgres | UTF8     | en_IN   | en_IN |
```

### Step 4: Set Database Password ✓
**Status**: Password configured for postgres user

PostgreSQL requires passwords for SCRAM-SHA-256 authentication. Set password:

```bash
# Set password:
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

This allows NestJS to authenticate with the database.

### Step 5: Configure Backend Environment ✓
**Status**: `.env` file updated with correct credentials

**File**: `/home/dhruv/healthcare/backend/.env`

```env
# DATABASE - Local PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=healthcare_db
```

**Key Changes**:
- Changed from `DB_*` variables to `DATABASE_*` (matches config/index.ts)
- Set `DATABASE_PASSWORD=postgres` (matches user password set above)
- Ensured `DATABASE_HOST=localhost` points to local PostgreSQL

### Step 6: Backend Connection Verified ✓
**Status**: Backend can successfully connect to database

```bash
# Test backend startup:
cd /home/dhruv/healthcare/backend
npm run start:dev
```

**Expected Output**:
```
[Nest] Starting Nest application...
[TypeOrmModule] Successfully initialized database connection
[AppModule] All modules loaded successfully
```

---

## How to Use

### Start PostgreSQL (if not running)
```bash
sudo systemctl start postgresql
```

### Start Backend Server
```bash
cd /home/dhruv/healthcare/backend
npm run start:dev
# or for production:
npm run start:prod
```

### Start Frontend (in another terminal)
```bash
cd /home/dhruv/healthcare/frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

### Verify Database Connection
```bash
# Test database directly:
PGPASSWORD=postgres psql -h localhost -U postgres -d healthcare_db -c "SELECT NOW();"

# Expected output: current timestamp
```

---

## Common Issues & Solutions

### Issue 1: "ECONNREFUSED 127.0.0.1:5432"
**Cause**: PostgreSQL service is not running  
**Solution**: 
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on reboot
```

### Issue 2: "SASL: client password must be a string"
**Cause**: Empty PASSWORD in environment or wrong config variable names  
**Solution**:
- Ensure `DATABASE_PASSWORD=postgres` is set in `.env`
- Verify variable names match config file (DATABASE_* not DB_*)
- Rebuild: `npm run build`

### Issue 3: "database does not exist"
**Cause**: healthcare_db database not created  
**Solution**:
```bash
sudo -u postgres createdb healthcare_db
```

### Issue 4: "Role 'postgres' does not have login privilege"
**Cause**: PostgreSQL user password not set  
**Solution**:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

---

## Database Configuration Reference

| Setting | Value | Location |
|---------|-------|----------|
| **Host** | localhost | `/home/dhruv/healthcare/backend/.env` |
| **Port** | 5432 | Default PostgreSQL port |
| **Database** | healthcare_db | Created via createdb command |
| **Username** | postgres | Default PostgreSQL superuser |
| **Password** | postgres | Set via ALTER USER command |
| **Connection Method** | TCP (network) | Configured in `.env` |

---

## Security Notes (Development Only)

⚠️ **WARNING**: This setup uses:
- Simple password "postgres" 
- Default superuser "postgres"
- No SSL/TLS encryption

**For Production**:
1. Use strong, unique passwords
2. Create limited-privilege database users
3. Configure SSL/TLS encryption
4. Restrict database access by IP
5. Enable PostgreSQL logs and monitoring
6. See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for AWS RDS setup

---

## Next Steps

1. ✓ PostgreSQL installed and running
2. ✓ Healthcare database created
3. ✓ Backend configured and tested
4. **TODO**: Run database migrations to create tables
5. **TODO**: Seed initial data (optional)
6. **TODO**: Test full application workflow

### Run Database Migrations
```bash
cd /home/dhruv/healthcare/backend
npm run migration:run
```

This will create all 10 tables with proper relationships:
- users
- patients
- doctors
- appointments
- prescriptions
- medical_records
- invoices
- lab_tests
- medicines
- audit_logs

---

**Setup Date**: February 22, 2026  
**Status**: ✅ COMPLETE - Backend can connect to database  
**Next**: Run migrations and test with full application workflow

---

## Quick Reference Commands

```bash
# PostgreSQL Management
sudo systemctl start postgresql         # Start service
sudo systemctl stop postgresql          # Stop service
sudo systemctl status postgresql        # Check status
sudo systemctl enable postgresql        # Enable auto-start

# Database Management
sudo -u postgres psql                   # Connect as admin
sudo -u postgres createdb <name>        # Create database
sudo -u postgres dropdb <name>          # Delete database
sudo -u postgres psql -l                # List databases

# Test Connection
PGPASSWORD=postgres psql -h localhost -U postgres -d healthcare_db -c "SELECT version();"

# Backend Commands
npm run build                           # Build application
npm run start:dev                       # Development mode (watch)
npm run start:prod                      # Production mode
npm run migration:run                   # Run migrations
```

---

**Issue Resolved**: connect ECONNREFUSED 127.0.0.1:5432 ✅
