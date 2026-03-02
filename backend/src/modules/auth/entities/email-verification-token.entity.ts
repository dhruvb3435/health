import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Stores hashed email verification tokens.
 *
 * Security model:
 * - The raw token is a cryptographically random UUID (never stored).
 * - Only the SHA-256 hash of the token is persisted here.
 * - The raw token is issued once (in the verification email) and discarded.
 * - Tokens expire after 24 hours. Expired tokens are rejected and deleted.
 */
@Entity('email_verification_tokens')
export class EmailVerificationToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    /** SHA-256 hex digest of the raw token sent to the user's email. */
    @Column({ unique: true })
    tokenHash: string;

    @Column({ type: 'timestamp' })
    @Index()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
