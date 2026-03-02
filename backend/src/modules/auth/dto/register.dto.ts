import { IsEmail, IsString, MinLength, IsEnum, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  /**
   * Must be supplied by the invite/org provisioning system.
   * Never accepted from unauthenticated self-registration.
   */
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
