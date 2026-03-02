import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { User, UserStatus } from '../users/entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { MailService } from '../mail/mail.service';

/** Token is valid for 24 hours. */
const EXPIRY_HOURS = 24;

@Injectable()
export class EmailVerificationService {
    private readonly logger = new Logger(EmailVerificationService.name);

    constructor(
        @InjectRepository(EmailVerificationToken)
        private readonly tokenRepo: Repository<EmailVerificationToken>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly mailService: MailService,
    ) { }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Issues a new verification token for the given user and sends the email.
     * Idempotent: any existing tokens for the user are replaced.
     */
    async sendVerificationEmail(user: User): Promise<void> {
        // Clean up any previous tokens for this user
        await this.tokenRepo.delete({ userId: user.id });

        const rawToken = randomUUID();
        const tokenHash = this.hash(rawToken);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + EXPIRY_HOURS);

        await this.tokenRepo.save(
            this.tokenRepo.create({ userId: user.id, tokenHash, expiresAt }),
        );

        await this.mailService.sendVerificationEmail(user, rawToken);
        this.logger.log(`Verification email dispatched to ${user.email}`);
    }

    /**
     * Validates the raw token, activates the user, and deletes the token.
     * Throws if the token is invalid, expired, or already used.
     */
    async verifyEmail(rawToken: string): Promise<{ message: string }> {
        if (!rawToken || rawToken.trim() === '') {
            throw new BadRequestException('Verification token is required.');
        }

        const tokenHash = this.hash(rawToken);

        const record = await this.tokenRepo.findOne({
            where: { tokenHash },
            relations: ['user'],
        });

        if (!record) {
            throw new BadRequestException('Invalid verification token. It may have already been used.');
        }

        if (record.expiresAt < new Date()) {
            // Clean up expired token so we don't leak state
            await this.tokenRepo.delete(record.id);
            throw new BadRequestException(
                'Verification token has expired. Please request a new one.',
            );
        }

        const user = record.user;

        if (!user) {
            await this.tokenRepo.delete(record.id);
            throw new NotFoundException('User associated with this token no longer exists.');
        }

        if (user.status === UserStatus.ACTIVE) {
            await this.tokenRepo.delete(record.id);
            return { message: 'Email is already verified. You may log in.' };
        }

        // Activate the user
        await this.userRepo.update(user.id, {
            status: UserStatus.ACTIVE,
            emailVerified: true,
        });

        // Consume the token — one-time use
        await this.tokenRepo.delete(record.id);

        this.logger.log(`Email verified and account activated: ${user.email}`);
        return { message: 'Email verified successfully. You may now log in.' };
    }

    /**
     * Resend verification email.
     * Rate-limiting should be applied at the controller/guard level.
     */
    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        const user = await this.userRepo.findOne({ where: { email } });

        // Always return the same message to prevent email enumeration
        const safeResponse = {
            message: 'If this email exists and is unverified, a new verification link has been sent.',
        };

        if (!user || user.status === UserStatus.ACTIVE) {
            return safeResponse;
        }

        await this.sendVerificationEmail(user);
        return safeResponse;
    }

    /**
     * Housekeeping: remove expired tokens.
     * Call this from a scheduled job.
     */
    async purgeExpiredTokens(): Promise<number> {
        const result = await this.tokenRepo.delete({
            expiresAt: LessThan(new Date()),
        });
        const count = result.affected ?? 0;
        if (count > 0) {
            this.logger.log(`Purged ${count} expired email verification token(s)`);
        }
        return count;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private hash(raw: string): string {
        return createHash('sha256').update(raw).digest('hex');
    }
}
