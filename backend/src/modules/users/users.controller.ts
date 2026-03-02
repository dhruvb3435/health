import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Audit } from '../../common/decorators/audit.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    @Patch('profile')
    @ApiOperation({ summary: 'Update authenticated user profile' })
    @Audit({ action: 'Update Profile', entityType: 'User' })
    async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        const user = await this.userRepo.findOne({ where: { id: req.user.id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        Object.assign(user, updateProfileDto);
        const saved = await this.userRepo.save(user);

        // Exclude sensitive fields from response
        const { password, refreshTokenHash, resetPasswordToken, mfaSecret, ...profile } = saved;
        return profile;
    }
}
