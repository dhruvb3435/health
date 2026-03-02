import {
    Injectable,
    Logger,
    ConflictException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';

import { Organization, OrganizationStatus } from '../organizations/entities/organization.entity';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { OrganizationUsage } from '../subscriptions/entities/organization-usage.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { OnboardingProgress } from '../onboarding/entities/onboarding-progress.entity';
import { SubscriptionStatus, SubscriptionPlanTier } from '../subscriptions/enums/subscription.enum';
import { MailService } from '../mail/mail.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';

/** Default usage counter keys seeded for every new organization. */
const DEFAULT_USAGE_KEYS = ['patients', 'doctors', 'appointments', 'staff'];

/** Bcrypt cost for password hashing (healthcare-grade). */
const BCRYPT_ROUNDS = 12;

/** Verification token validity (hours). */
const VERIFY_EXPIRY_HOURS = 24;

/**
 * RegisterOrganizationService
 *
 * Performs the complete clinic onboarding flow inside a SINGLE database
 * transaction. If any step fails, PostgreSQL rolls back every insert and
 * the caller receives a clean error — no half-created organizations.
 *
 * Transaction steps (in order):
 *  1. Verify slug + email uniqueness (inside tx for serializable guarantee)
 *  2. Create Organization (status = TRIAL)
 *  3. Create Admin User (status = PENDING_VERIFICATION)
 *  4. Seed default RBAC roles for the org (admin, doctor, nurse, receptionist)
 *  5. Assign ADMIN role to the new user
 *  6. Create trial Subscription linked to the FREE/TRIAL plan
 *  7. Seed OrganizationUsage counters (set to 0)
 *  8. Create & hash email verification token
 *  9. Seed OnboardingProgress record
 *
 * After commit:
 *  - Verification email dispatched (non-blocking fire-and-forget)
 */
@Injectable()
export class RegisterOrganizationService {
    private readonly logger = new Logger(RegisterOrganizationService.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,

        @InjectRepository(Plan)
        private readonly planRepository: Repository<Plan>,

        private readonly mailService: MailService,
    ) { }

    async registerOrganization(dto: RegisterOrganizationDto): Promise<{
        message: string;
        organizationId: string;
        userId: string;
        email: string;
    }> {
        // ── Pre-flight: look up the TRIAL plan (outside tx; read-only) ────────
        const trialPlan = await this.planRepository.findOne({
            where: { tier: SubscriptionPlanTier.TRIAL },
        });

        if (!trialPlan) {
            throw new NotFoundException(
                'System configuration error: no TRIAL plan found. Contact support.',
            );
        }

        // ── ATOMIC TRANSACTION ────────────────────────────────────────────────
        let createdUser: User;
        let createdOrg: Organization;
        let rawVerificationToken: string;

        try {
            const result = await this.dataSource.transaction(
                'SERIALIZABLE',
                async (manager: EntityManager) => {
                    // ── Step 1: Uniqueness guards ──────────────────────────────

                    const existingOrg = await manager.findOne(Organization, {
                        where: { slug: dto.organizationSlug },
                    });
                    if (existingOrg) {
                        throw new ConflictException(
                            `An organization with slug "${dto.organizationSlug}" already exists.`,
                        );
                    }

                    const existingUser = await manager.findOne(User, {
                        where: { email: dto.email },
                    });
                    if (existingUser) {
                        throw new ConflictException(
                            `An account with email "${dto.email}" already exists.`,
                        );
                    }

                    // ── Step 2: Create Organization ────────────────────────────

                    const org = manager.create(Organization, {
                        name: dto.organizationName,
                        slug: dto.organizationSlug,
                        status: OrganizationStatus.TRIAL,
                        settings: {
                            phone: dto.phone ?? null,
                            onboardingCompleted: false,
                        },
                    });
                    const savedOrg = await manager.save(Organization, org);

                    // ── Step 3: Create Admin User ──────────────────────────────

                    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
                    const userId = await this.generateUserId(manager, savedOrg.id);

                    const user = manager.create(User, {
                        userId,
                        email: dto.email,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        password: hashedPassword,
                        organizationId: savedOrg.id,
                        status: UserStatus.PENDING_VERIFICATION,
                        emailVerified: false,
                    });
                    const savedUser = await manager.save(User, user);

                    // ── Step 4: Seed default RBAC roles for this organization ──

                    const allPermissions = await manager.find(Permission);
                    const savedAdminRole = await this.seedDefaultRoles(
                        manager,
                        savedOrg.id,
                        allPermissions,
                    );

                    // ── Step 5: Assign ADMIN role to the new user ──────────────

                    savedUser.roles = [savedAdminRole];
                    await manager.save(User, savedUser);

                    // ── Step 6: Create Trial Subscription ─────────────────────

                    const trialStart = new Date();
                    const trialEnd = new Date();
                    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

                    const subscription = manager.create(Subscription, {
                        organizationId: savedOrg.id,
                        planId: trialPlan.id,
                        status: SubscriptionStatus.TRIAL,
                        trialStartDate: trialStart,
                        trialEndDate: trialEnd,
                        currentPeriodStart: trialStart,
                        currentPeriodEnd: trialEnd,
                        cancelAtPeriodEnd: false,
                    });
                    await manager.save(Subscription, subscription);

                    // ── Step 7: Seed Usage Counters ────────────────────────────

                    const usageRecords = DEFAULT_USAGE_KEYS.map(key =>
                        manager.create(OrganizationUsage, {
                            organizationId: savedOrg.id,
                            featureKey: key,
                            usedCount: 0,
                            lastResetAt: new Date(),
                        }),
                    );
                    await manager.save(OrganizationUsage, usageRecords);

                    // ── Step 8: Create Email Verification Token ────────────────

                    const rawToken = randomUUID();
                    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + VERIFY_EXPIRY_HOURS);

                    const verificationToken = manager.create(EmailVerificationToken, {
                        userId: savedUser.id,
                        tokenHash,
                        expiresAt,
                    });
                    await manager.save(EmailVerificationToken, verificationToken);

                    // ── Step 9: Seed Onboarding Progress ──────────────────────

                    const progress = manager.create(OnboardingProgress, {
                        organizationId: savedOrg.id,
                        currentStep: 1,
                        completedSteps: [],
                        isCompleted: false,
                    });
                    await manager.save(OnboardingProgress, progress);

                    return { savedOrg, savedUser, rawToken };
                },
            );

            createdOrg = result.savedOrg;
            createdUser = result.savedUser;
            rawVerificationToken = result.rawToken;
        } catch (error) {
            // Re-throw known business errors (ConflictException, etc.)
            if (
                error instanceof ConflictException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }

            // Catch DB unique constraint violations (race condition safety net)
            if ((error as any)?.code === '23505') {
                const detail: string = (error as any)?.detail ?? '';
                if (detail.includes('slug')) {
                    throw new ConflictException(
                        `An organization with this slug already exists.`,
                    );
                }
                if (detail.includes('email')) {
                    throw new ConflictException(
                        `An account with this email already exists.`,
                    );
                }
                throw new ConflictException('A uniqueness constraint was violated.');
            }

            this.logger.error(
                `registerOrganization failed for slug="${dto.organizationSlug}": ${(error as Error).message}`,
                (error as Error).stack,
            );
            throw new InternalServerErrorException(
                'Registration failed due to a server error. Please try again.',
            );
        }

        // ── Post-commit: send verification email (non-blocking) ───────────────
        this.mailService
            .sendVerificationEmail(createdUser, rawVerificationToken)
            .catch(err =>
                this.logger.error(
                    `Failed to dispatch verification email to ${createdUser.email}: ${err.message}`,
                ),
            );

        this.logger.log(
            `Organization registered: "${createdOrg.name}" (${createdOrg.id}) — ` +
            `admin: ${createdUser.email}`,
        );

        return {
            message:
                'Organization created successfully. Please check your email to verify your account before logging in.',
            organizationId: createdOrg.id,
            userId: createdUser.id,
            email: createdUser.email,
        };
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Seed all default RBAC roles for a new organization inside the transaction.
     * Returns the ADMIN role so it can be assigned to the registering user.
     */
    private async seedDefaultRoles(
        manager: EntityManager,
        organizationId: string,
        allPermissions: Permission[],
    ): Promise<Role> {
        const roleDefinitions = [
            {
                name: 'admin',
                description: 'Full system access',
                isSystemRole: true,
                getPermissions: () => allPermissions, // admin gets everything
            },
            {
                name: 'doctor',
                description: 'Patient records, prescriptions, appointments',
                isSystemRole: true,
                getPermissions: () =>
                    allPermissions.filter(p =>
                        ['patients', 'appointments', 'prescriptions', 'laboratory', 'pharmacy'].some(cat =>
                            p.category?.toLowerCase().includes(cat),
                        ),
                    ),
            },
            {
                name: 'nurse',
                description: 'Ward management and patient care',
                isSystemRole: true,
                getPermissions: () =>
                    allPermissions.filter(p =>
                        ['patients', 'wards', 'admissions'].some(cat =>
                            p.category?.toLowerCase().includes(cat),
                        ),
                    ),
            },
            {
                name: 'receptionist',
                description: 'Appointments and patient queue',
                isSystemRole: true,
                getPermissions: () =>
                    allPermissions.filter(p =>
                        ['appointments', 'patients'].some(cat =>
                            p.category?.toLowerCase().includes(cat),
                        ),
                    ),
            },
        ];

        let adminRole: Role | null = null;

        for (const def of roleDefinitions) {
            const role = manager.create(Role, {
                name: def.name,
                description: def.description,
                organizationId,
                isSystemRole: def.isSystemRole,
                permissions: def.getPermissions(),
            });
            const saved = await manager.save(Role, role);
            if (def.name === 'admin') {
                adminRole = saved;
            }
        }

        return adminRole!;
    }

    /**
     * Generates a sequential user ID like ADM-000001 within the transaction.
     */
    private async generateUserId(manager: EntityManager, organizationId: string): Promise<string> {
        const count = await manager.count(User, { where: { organizationId } });
        return `ADM-${String(count + 1).padStart(6, '0')}`;
    }
}
