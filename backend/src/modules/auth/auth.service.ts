import { Injectable, UnauthorizedException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { User, UserStatus, UserRole } from '../users/entities/user.entity';
import { RbacService } from '../rbac/rbac.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';
import { MailService } from '../mail/mail.service';
import { BCRYPT_ROUNDS } from '../../common/constants/security';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rbacService: RbacService,
    @Inject(forwardRef(() => EmailVerificationService))
    private emailVerificationService: EmailVerificationService,
    private mailService: MailService,
  ) { }

  async register(registerDto: RegisterDto) {
    // organizationId MUST come from a verified invite/org context, never defaulted.
    // Public self-registration is currently disabled.
    // This endpoint is reserved for super-admin seeding and org-specific invite flows.
    if (!registerDto.organizationId) {
      throw new UnauthorizedException(
        'organization_id is required. Self-registration without an organization context is not permitted.',
      );
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email, organizationId: registerDto.organizationId },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered for this organization');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);
    const userId = await this.generateUserId(registerDto.role, registerDto.organizationId);

    const roles = await this.rbacService.getOrganizationRoles(registerDto.organizationId);
    const role = roles.find(r => r.name === (registerDto.role || UserRole.PATIENT));

    const user = new User({
      userId,
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hashedPassword,
      roles: role ? [role] : [],
      status: UserStatus.PENDING_VERIFICATION,
      organizationId: registerDto.organizationId,
    });

    await this.usersRepository.save(user);
    this.logger.log(`User registered: ${user.email} in org: ${user.organizationId}`);

    // Send verification email asynchronously — do not let email failure block the response.
    this.emailVerificationService.sendVerificationEmail(user).catch(err =>
      this.logger.error(`Failed to dispatch verification email: ${err.message}`),
    );

    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active. Please verify your email.');
    }

    // Enforce organization context before issuing any token.
    if (!user.organizationId) {
      this.logger.error(`Login blocked — user ${user.email} has no organizationId`);
      throw new UnauthorizedException('User account is not associated with any organization.');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    this.logger.log(`Login OK: ${user.email} (org: ${user.organizationId})`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles?.map((r: any) => (r.name ?? r).toLowerCase()) ?? [],
        organizationId: user.organizationId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });

      const isRefreshTokenValid = user?.refreshTokenHash && (await bcrypt.compare(refreshToken, user.refreshTokenHash));

      if (!user || !isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.organizationId) {
        throw new UnauthorizedException('User account has no organization context. Refresh denied.');
      }

      const tokens = this.generateTokens(user);
      const salt = await bcrypt.genSalt(10);
      user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, salt);
      await this.usersRepository.save(user);

      this.logger.log(`Tokens refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, refreshTokenHash, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  async forgotPassword(email: string) {
    // Always return the same message to prevent email enumeration
    const safeResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      return safeResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    await this.usersRepository.save(user);

    // Send reset email asynchronously
    this.mailService.sendPasswordResetEmail(user, rawToken).catch(err =>
      this.logger.error(`Failed to send password reset email: ${err.message}`),
    );

    return safeResponse;
  }

  async resetPassword(rawToken: string, newPassword: string) {
    if (!rawToken) {
      throw new BadRequestException('Reset token is required.');
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.usersRepository.save(user);

    this.logger.log(`Password reset successfully for user: ${user.email}`);
    return { message: 'Password has been reset successfully. You may now log in.' };
  }

  private generateTokens(user: User) {
    // Hard requirement: organizationId must be present before issuing any token.
    if (!user.organizationId) {
      throw new UnauthorizedException(
        'Cannot issue token: user has no organization context.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      userId: user.userId,
      roles: (user.roles ?? []).map((r: any) => (r.name ?? r).toLowerCase()),
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(this.configService.get<string>('JWT_EXPIRATION') || '86400'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '604800'),
    });

    return { accessToken, refreshToken };
  }

  private async generateUserId(role: UserRole, organizationId: string): Promise<string> {
    const rolePrefix: Record<string, string> = {
      [UserRole.DOCTOR]: 'DOC',
      [UserRole.NURSE]: 'NUR',
      [UserRole.RECEPTIONIST]: 'REC',
      [UserRole.PATIENT]: 'PAT',
      [UserRole.PHARMACIST]: 'PHA',
      [UserRole.LAB_TECHNICIAN]: 'LAB',
      [UserRole.ADMIN]: 'ADM',
    };

    const prefix = rolePrefix[role] || 'USR';

    // Use MAX-based approach to avoid race condition with count-based IDs.
    // Find the highest existing numeric suffix for this prefix+org, then increment.
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.organizationId = :organizationId', { organizationId })
      .andWhere('user.userId LIKE :prefix', { prefix: `${prefix}-%` })
      .select('MAX(user.userId)', 'maxId')
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxId) {
      const numericPart = result.maxId.split('-')[1];
      nextNumber = parseInt(numericPart, 10) + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(6, '0')}`;
  }
}
