---
name: Aaro System Analysis
description: Comprehensive analysis of Aaro (Aarogentix) healthcare management system - architecture, bugs, and recommendations
type: project
---

# Aaro Healthcare Management System - Analysis Summary (2026-03-12)

## Stack
- Backend: NestJS 10 + TypeORM + PostgreSQL (22 modules, 30 entities)
- Frontend: Next.js 14 + Tailwind + Zustand (31 pages)
- Deployment: Railway (backend) + Vercel (frontend)
- Payments: Stripe Checkout + Webhooks

## Critical Bugs Found
1. **Cross-Tenant Data Leaks**: DashboardService.getRecentActivity(), WardsService (all methods), ComplianceService (all methods) - no organizationId filtering
2. **JWT_EXPIRATION="1h"** parsed via parseInt() returns 1 (1 second), tokens expire immediately
3. **STRIPE_SECRET_KEY missing crashes entire app** at SubscriptionsService constructor
4. **Admissions create/discharge** modifies 3 entities without transaction
5. **Register page** calls wrong endpoint (user register instead of org register)
6. **useSubscription hook** reads removed Organization.subscriptionPlan field
7. **Global unique constraints** on per-org data (medicineCode, wardCode, etc.)
8. **Patient.ssn stored in plain text**
9. **.env committed to repo** with dev credentials
10. **AuditService never called** - AuditInterceptor calls ComplianceService instead

## Multi-Tenancy Architecture
- TenantService is request-scoped, set by TenantInterceptor from JWT
- TenantGuard validates header/body org IDs match JWT
- BaseRepository has automatic tenant scoping (but only 5 services use it)
- Services without BaseRepository must manually call TenantService.getTenantId()

## Key Architectural Decisions
- Organization registration uses SERIALIZABLE transaction (9 steps)
- Subscription billing via Stripe Checkout with webhook processing
- RBAC: Role -> Permission (ManyToMany), User -> Role (ManyToMany), all org-scoped
- Feature limits enforced via PlanValidationGuard + UsageService
- Email verification via SHA-256 hashed one-time tokens

## Missing Modules (Priority Order)
1. OPD Queue, Vitals/Clinical Observations, Departments
2. Insurance/TPA Claims, PDF Generation, Appointment Reminders
3. Patient Portal, Teleconsultation, SMS/WhatsApp, Report Builder
