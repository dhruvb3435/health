import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsNotEmpty,
    IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterOrganizationDto {
    // ── Organization fields ────────────────────────────────────────────────

    @ApiProperty({
        description: 'Full legal name of the clinic / hospital',
        example: 'City General Hospital',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    organizationName: string;

    /**
     * URL-friendly identifier for the organization.
     * Allows lowercase letters, digits, and hyphens.
     * 3–60 characters.
     */
    @ApiProperty({
        description: 'Unique URL slug for the organization (lowercase, hyphens allowed)',
        example: 'city-general',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(60)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message:
            'organizationSlug must be lowercase letters, digits, and hyphens only (e.g. my-clinic-2024)',
    })
    organizationSlug: string;

    // ── Admin user fields ──────────────────────────────────────────────────

    @ApiProperty({ description: 'Admin first name', example: 'Dhruv' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
    firstName: string;

    @ApiProperty({ description: 'Admin last name', example: 'Bagadiya' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(60)
    lastName: string;

    @ApiProperty({ description: 'Admin email address', example: 'admin@citygeneralhospital.com' })
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

    /**
     * Minimum 8 chars, must contain at least one uppercase letter,
     * one digit, and one special character.
     */
    @ApiProperty({
        description: 'Admin password (min 8 chars, upper + digit + special required)',
        example: 'Secure@2024',
    })
    @IsString()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"|,.<>/?])/, {
        message:
            'password must contain at least one uppercase letter, one digit, and one special character',
    })
    password: string;

    @ApiPropertyOptional({ description: 'Primary phone for the clinic', example: '+91 98765 43210' })
    @IsString()
    @IsOptional()
    @MaxLength(30)
    phone?: string;
}
