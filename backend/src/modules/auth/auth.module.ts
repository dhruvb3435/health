import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterOrganizationService } from './register-organization.service';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RbacModule } from '../rbac/rbac.module';
import { MailModule } from '../mail/mail.module';
import { Plan } from '../subscriptions/entities/plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EmailVerificationToken, Plan]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            '[FATAL] JWT_SECRET environment variable is not set. '
            + 'Application cannot start without a secure JWT secret.',
          );
        }

        const rawExpiry = configService.get<string>('JWT_EXPIRATION');
        const expiresIn = rawExpiry ? parseInt(rawExpiry, 10) : undefined;
        if (!expiresIn || isNaN(expiresIn)) {
          throw new Error(
            '[FATAL] JWT_EXPIRATION environment variable is missing or not a valid number.',
          );
        }

        return { secret, signOptions: { expiresIn } };
      },
    }),
    RbacModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationService, RegisterOrganizationService, JwtStrategy],
  exports: [AuthService, EmailVerificationService, JwtModule, PassportModule],
})
export class AuthModule { }
