import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { MailService } from '../mail/mail.service';
import { UpdateOnboardingStepDto } from './dto/update-onboarding.dto';

interface AuthRequest extends Request {
    user: { organizationId: string; sub: string; };
}

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Get('progress')
    async getProgress(@Request() req: AuthRequest) {
        return this.onboardingService.getProgress(req.user.organizationId);
    }

    @Put('progress')
    async updateStep(@Request() req: AuthRequest, @Body() dto: UpdateOnboardingStepDto) {
        return this.onboardingService.updateStep(req.user.organizationId, dto);
    }

    @Post('generate-demo')
    @HttpCode(HttpStatus.OK)
    async generateDemo(@Request() req: AuthRequest) {
        return this.onboardingService.generateDemoData(req.user.organizationId);
    }

    @Post('complete')
    @HttpCode(HttpStatus.OK)
    async complete(@Request() req: AuthRequest) {
        return this.onboardingService.completeOnboarding(req.user.organizationId, req.user.sub);
    }
}
