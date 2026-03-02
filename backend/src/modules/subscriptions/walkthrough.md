# SaaS Plan Limits Enforcement

Implemented a robust usage tracking and plan limit enforcement system for the Aarogentix SaaS platform. This ensures that organizations are restricted to the feature quotas defined by their subscription plans (e.g., maximum patients, doctors, and appointments).

## Changes Made

### Backend

#### Usage Tracking & Enforcement
- **`UsageService`**: Created a new service with an atomic `increment` method using raw PostgreSQL `ON CONFLICT DO UPDATE` for thread-safe counters.
- **`PlanValidationGuard`**: Enhanced to performs real-time checks against `feature_limits` and `organization_usage` before allowing resource creation.
- **Transactional Increments**: Updated `PatientsService`, `DoctorsService`, and `AppointmentsService` to use `UsageService.increment` within database transactions, ensuring resource creation and usage tracking are atomic.

#### Database
- **Table Rename**: Renamed the `usage_tracking` table to `organization_usage` for clarity.
- **Migration**: Generated and applied a TypeORM migration to handle the table rename and index updates.

#### Controllers
- **Guard Registration**: Applied `PlanValidationGuard` globally or at the controller level for `Patients`, `Doctors`, and `Appointments`.
- **Feature Decorators**: Added `@RequireFeatureLimit('MAX_X')` to the `POST` endpoints of each service.

## Verification Results

### Automated Tests
- **Backend Build**: Verified successful compilation with `npm run build`.
- **Frontend Build**: Verified successful compilation with `npm run build`.
- **E2E Simulation**: Created a `verify-usage-limits.ts` script to test quota enforcement.

#### Simulation Log Output:
```text
Attempting to create Patient #1...
✅ Guard: PASSED
✅ Service: Patient #1 created successfully.
Current Usage: 1

Attempting to create Patient #2...
✅ Guard: PASSED
✅ Service: Patient #2 created successfully.
Current Usage: 2

Attempting to create Patient #3...
✅ Guard: PASSED
❌ FAILED: Limit exceeded for MAX_PATIENTS. Used: 2, Limit: 2. Please upgrade your plan.
```

The system correctly rejects the creation of a third patient when the plan limit is set to 2.

## How to Verify
1.  **Run Build**: Ensure `npm run build` passes in both `backend` and `frontend`.
2.  **Try Exceeding Limits**: Create an organization, assign a plan with a low limit (e.g., 2 patients), and attempt to create more than that number of patients via the API.

## Changes Made - Phase 2: Stripe Webhook & Strict Access

### Webhook Handling
- **Payment Failure Handling**: Implemented logic in `SubscriptionsService.handleStripeWebhook` to handle `invoice.payment_failed`.
    - Automatically sets subscription status to `PAST_DUE`.
    - Correctly finds the organization and admin user to notify.
- **Signature Validation**: Verified that `stripe.webhooks.constructEvent` is used with the `STRIPE_WEBHOOK_SECRET`.
- **Email Notifications**: Added `sendPaymentFailedNotification` to `MailService` and created a new responsive HTML template `payment-failed.hbs`.
- **Dependency Injection**: Updated `SubscriptionsModule` to include `User` and `Organization` entities and injected `MailService`.

### Strict Access Control
- **`PlanValidationGuard`**: Updated to strictly require `SubscriptionStatus.ACTIVE`. Any other status (including `PAST_DUE`, `TRIAL`, `CANCELLED`) will now block access to protected routes with a `402 Payment Required` or `403 Forbidden` response.

## Updated Verification Results

### Webhook Logic Simulation
Verified that receiving a payment failure event updates the database:
1. Subscription for test organization set to `ACTIVE`.
2. Mock `invoice.payment_failed` logic triggered.
3. Subscription status changed to `PAST_DUE` in DB.
4. Log entry: `Payment failure notification sent to admin@test.com`.

### Guard Verification
1. Attempted access with `ACTIVE` status: `200 OK`.
2. Attempted access with `PAST_DUE` status: `402 Payment Required` with message "Subscription is past due. Please update your payment method."
3. Attempted access with `TRIAL` status: `403 Forbidden` (as per strict "ACTIVE" only requirement).

## Changes Made - Phase 3: Entity Audit & Optimization

### Entity Enhancements
- **`AuditLog`**: Added `organizationId` column and formal `ManyToOne` relationships to both `Organization` and `User` entities with `ON DELETE SET NULL` constraints.
- **`Subscription`**: Formalized the relationship to `Organization` using a `ManyToOne` decorator with `ON DELETE CASCADE`.

### Performance Optimization (Composite Indexes)
Added the following composite indexes to optimize common multi-tenant queries:
- **`AuditLog`**:
    - `(organizationId, createdAt)` - For historical audit trail reports.
    - `(organizationId, userId)` - For per-user activity monitoring.
- **`Subscription`**:
    - `(organizationId, status)` - For subscription lifecycle validation in guards.
- **`Doctor`**:
    - `(organizationId, createdAt)` - For chronological staff listings.
- **`Patient` & `Appointment`**: Verified existing composite indexes cover `(organizationId, createdAt)` and `(organizationId, status)` respectively.

### Database Migration
- Generated and executed migration `AuditEntitiesAndIndexes`.
- **Safety**: Verified the `audit_logs` table was empty before performing schema changes that involved type modifications (`userId` from `varchar` to `uuid`), ensuring no data loss occurred.

## How to Verify
1. **Schema Check**: Run `psql $DATABASE_URL -c "\d audit_logs"` and verify foreign keys and indexes.
2. **Access Patterns**: Verify that queries filtered by `organizationId` and `status`/`createdAt` use the new indexes via `EXPLAIN ANALYZE`.
